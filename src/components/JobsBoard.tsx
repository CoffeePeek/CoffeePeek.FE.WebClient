import { useState } from 'react';
import { mockJobs } from '../data/mockData';
import { Briefcase, MapPin, Clock, DollarSign, Star, Filter } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function JobsBoard() {
  const [jobType, setJobType] = useState<'all' | 'barista' | 'manager' | 'roaster'>('all');

  const filteredJobs = mockJobs.filter((job) => {
    if (jobType === 'all') return true;
    return job.title.toLowerCase().includes(jobType);
  });

  const premiumJobs = filteredJobs.filter((job) => job.isPremium);
  const regularJobs = filteredJobs.filter((job) => !job.isPremium);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-neutral-900 mb-2">Вакансии</h1>
        <p className="text-neutral-600 text-sm">
          Найдите работу мечты в кофейной индустрии
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={(value) => setJobType(value as any)}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="barista">Бариста</TabsTrigger>
          <TabsTrigger value="manager">Менеджер</TabsTrigger>
          <TabsTrigger value="roaster">Обжарщик</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Premium Jobs */}
      {premiumJobs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="size-5 fill-amber-500 text-amber-500" />
            <h2 className="text-neutral-900">Premium вакансии</h2>
          </div>
          <div className="space-y-3">
            {premiumJobs.map((job) => (
              <Card
                key={job.id}
                className="overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-neutral-900">{job.title}</h3>
                        <Badge className="bg-amber-700">Premium</Badge>
                      </div>
                      <p className="text-neutral-700 mb-2">{job.company}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="size-4" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="size-4" />
                      <span>{job.type}</span>
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <DollarSign className="size-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">
                      Опубликовано: {job.postedDate}
                    </span>
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
          {regularJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-neutral-900 mb-1">{job.title}</h3>
                    <p className="text-neutral-700 mb-2">{job.company}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <MapPin className="size-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Clock className="size-4" />
                    <span>{job.type}</span>
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <DollarSign className="size-4" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    Опубликовано: {job.postedDate}
                  </span>
                  <Button size="sm" variant="outline">
                    Подробнее
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredJobs.length === 0 && (
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
