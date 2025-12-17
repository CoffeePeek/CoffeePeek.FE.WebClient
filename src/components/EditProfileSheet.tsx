import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi } from '../api';
import type { UpdateProfileRequest, UserDto } from '../api/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { toErrorMessage } from '../shared/lib/errors';

type EditProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void> | void;
};

export function EditProfileSheet({ open, onOpenChange, onSaved }: EditProfileSheetProps) {
  const { data: profileResponse, isFetching } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userApi.getProfile(),
    enabled: open,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const userDto: UserDto | undefined = profileResponse?.data;

  const initial = useMemo(
    () => ({
      userName: userDto?.userName ?? '',
      username: userDto?.username ?? '',
      about: userDto?.about ?? '',
      email: userDto?.email ?? '',
    }),
    [userDto]
  );

  const [userName, setUserName] = useState('');
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    if (!open) return;
    setUserName(initial.userName);
    setUsername(initial.username);
    setAbout(initial.about);
  }, [initial.about, initial.userName, initial.username, open]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userApi.updateProfile(payload),
    onSuccess: async () => {
      toast.success('Профиль обновлен');
      await onSaved();
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error('Не удалось обновить профиль', {
        description: toErrorMessage(e),
      });
    },
  });

  const handleSave = () => {
    const payload: UpdateProfileRequest = {
      userName: userName.trim() || undefined,
      username: username.trim() || undefined,
      about: about.trim() ? about.trim() : null,
    };
    mutation.mutate(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl">
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <SheetHeader className="pb-2">
          <SheetTitle>Редактировать профиль</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-4 pb-28 space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={initial.email} disabled className="h-12 text-base" />
          </div>

          <div className="space-y-2">
            <Label>Имя</Label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Как вас показать в профиле"
              autoComplete="name"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nickname"
              autoComplete="username"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>О себе</Label>
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Коротко о себе (необязательно)"
              maxLength={280}
            />
            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex justify-between">
              <span>{isFetching ? 'Обновляем данные…' : ''}</span>
              <span>{about.length}/280</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Отмена
            </Button>
            <Button className="flex-1 h-12" onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? 'Сохраняем…' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


