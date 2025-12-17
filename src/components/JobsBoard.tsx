import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { internalApi, vacanciesApi } from '../api';
import type { CityDto, GetVacanciesResponse, VacancyDto, VacancyJobType } from '../api/types';
import { mockJobs } from '../data/mockData';
import { Briefcase, Clock, DollarSign, MapPin, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function JobsBoard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const cityId = searchParams.get('cityId') ?? '';
  const jobTypeParam = (searchParams.get('jobType') ?? 'All') as VacancyJobType;

  const jobType: VacancyJobType = useMemo(() => {
    const allowed: VacancyJobType[] = ['All', 'Barista', 'Manager', 'Cook'];
    return allowed.includes(jobTypeParam) ? jobTypeParam : 'All';
  }, [jobTypeParam]);

  const { data: citiesResponse, isLoading: isCitiesLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => internalApi.getCities(),
    staleTime: 10 * 60 * 1000,
  });

  const cities: CityDto[] = citiesResponse?.data?.cities ?? [];

  // Ensure we always have a cityId (vacancies endpoint requires it).
  useEffect(() => {
    if (cityId || isCitiesLoading) return;
    const first = cities[0]?.id;
    if (!first) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('cityId', first);
      return next;
    });
  }, [cities, cityId, isCitiesLoading, setSearchParams]);

  const extractVacancies = (res: GetVacanciesResponse | undefined): VacancyDto[] => {
    const data = res?.data as unknown;
    if (!data) return [];
    if (Array.isArray(data)) return data as VacancyDto[];
    if (typeof data === 'object') {
      const anyData = data as any;
      if (Array.isArray(anyData.vacancies)) return anyData.vacancies as VacancyDto[];
      if (Array.isArray(anyData.content)) return anyData.content as VacancyDto[];
      if (Array.isArray(anyData.items)) return anyData.items as VacancyDto[];
    }
    return [];
  };

  const fallbackVacancies: VacancyDto[] = useMemo(() => {
    return mockJobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.type,
      salary: j.salary,
    }));
  }, []);

  const {
    data: vacanciesResponse,
    isLoading: isVacanciesLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vacancies', cityId, jobType],
    enabled: Boolean(cityId),
    queryFn: () =>
      vacanciesApi.getVacancies({
        cityId,
        jobType,
        page: 1,
        perPage: 30,
      }),
    staleTime: 60 * 1000,
    retry: 2,
  });

  const vacancies = useMemo(() => extractVacancies(vacanciesResponse), [vacanciesResponse]);
  const showFallback = Boolean(error);
  const items = vacancies.length > 0 ? vacancies : showFallback ? fallbackVacancies : [];

  const premiumItems = useMemo(() => {
    // API currently doesn't return premium flag; keep premium only for fallback mock data.
    const mockPremiumIds = new Set(mockJobs.filter((j) => j.isPremium).map((j) => j.id));
    return items.filter((v) => v.id && mockPremiumIds.has(v.id));
  }, [items]);
  const regularItems = useMemo(() => {
    const premiumIds = new Set(premiumItems.map((v) => v.id));
    return items.filter((v) => !v.id || !premiumIds.has(v.id));
  }, [items, premiumItems]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-neutral-900 mb-2">Вакансии</h1>
        <p className="text-neutral-600 text-sm">
          Найдите работу мечты в кофейной индустрии
        </p>
      </div>

      {/* City */}
      <div className="mb-4 space-y-2">
        <Label>Город</Label>
        <Select
          value={cityId || 'loading'}
          onValueChange={(value) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('cityId', value);
              return next;
            });
          }}
          disabled={isCitiesLoading || cities.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={isCitiesLoading ? 'Загрузка…' : 'Выберите город'} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs
        value={jobType}
        className="mb-6"
        onValueChange={(value) => {
          const nextType = value as VacancyJobType;
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (nextType === 'All') next.delete('jobType');
            else next.set('jobType', nextType);
            return next;
          });
        }}
      >
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="All">Все</TabsTrigger>
          <TabsTrigger value="Barista">Бариста</TabsTrigger>
          <TabsTrigger value="Manager">Менеджер</TabsTrigger>
          <TabsTrigger value="Cook">Кухня</TabsTrigger>
        </TabsList>
        <TabsContent value={jobType} />
      </Tabs>

      {showFallback && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>Сервис вакансий недоступен — показываем демо-вакансии.</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      )}

      {/* Premium Jobs */}
      {premiumItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="size-5 fill-amber-500 text-amber-500" />
            <h2 className="text-neutral-900">Premium вакансии</h2>
          </div>
          <div className="space-y-3">
            {premiumItems.map((job) => (
              <Card
                key={job.id ?? `${job.title}-${job.company}`}
                className="overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-neutral-900">{job.title ?? 'Вакансия'}</h3>
                        <Badge className="bg-amber-700">Premium</Badge>
                      </div>
                      <p className="text-neutral-700 mb-2">{job.company ?? 'Компания'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="size-4" />
                      <span>{job.location ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="size-4" />
                      <span>{job.type ?? '—'}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <DollarSign className="size-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{isFetching ? 'Обновление…' : ''}</span>
                    <Button size="sm" className="bg-amber-700 hover:bg-amber-800">
                      Откликнуться
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Regular Jobs */}
      <div>
        <h2 className="text-neutral-900 mb-3">Все вакансии</h2>
        <div className="space-y-3">
          {isVacanciesLoading && (
            <>
              {Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {!isVacanciesLoading &&
            regularItems.map((job) => (
              <Card key={job.id ?? `${job.title}-${job.company}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-neutral-900 mb-1">{job.title ?? 'Вакансия'}</h3>
                      <p className="text-neutral-700 mb-2">{job.company ?? 'Компания'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="size-4" />
                      <span>{job.location ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="size-4" />
                      <span>{job.type ?? '—'}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <DollarSign className="size-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{isFetching ? 'Обновление…' : ''}</span>
                    <Button size="sm" variant="outline">
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {!isVacanciesLoading && items.length === 0 && !isCitiesLoading && (
        <div className="text-center py-12">
          <Briefcase className="size-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            По вашему запросу вакансий не найдено
          </p>
        </div>
      )}
    </div>
  );
}
