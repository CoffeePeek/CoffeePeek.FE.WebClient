import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CommunityFeedFilter,
  CommunityFeedItem,
  CommunityPostType,
  createCommunityPost,
  getCommunityFeed,
  setCommunityReaction,
} from '../api/community';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { AppIcon } from '../components/icons';

const FILTERS: Array<{ value: CommunityFeedFilter; label: string }> = [
  { value: 'All', label: 'Всё' },
  { value: 'Posts', label: 'Посты' },
  { value: 'Reviews', label: 'Отзывы' },
  { value: 'CheckIns', label: 'Чек-ины' },
  { value: 'Following', label: 'Подписки' },
  { value: 'FollowedCities', label: 'Мои города' },
];

const POST_TYPES: Array<{ value: CommunityPostType; label: string }> = [
  { value: 'Discussion', label: 'Обсуждение' },
  { value: 'Question', label: 'Вопрос' },
  { value: 'Tip', label: 'Совет' },
];

const itemTypeLabel = (type: CommunityFeedItem['type']) => {
  if (type === 'Post' || type === 3) return 'Пост';
  if (type === 'Review' || type === 1) return 'Отзыв';
  return 'Чек-ин';
};

const itemText = (item: CommunityFeedItem) => item.comment || item.note || '';

const CommunityPage: React.FC = () => {
  usePageTitle('Сообщество');
  const navigate = useNavigate();
  const { user, requireAuth } = useRequireAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<CommunityFeedFilter>('All');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postType, setPostType] = useState<CommunityPostType>('Discussion');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const feedQuery = useQuery({
    queryKey: ['community-feed', filter],
    queryFn: async () => {
      const response = await getCommunityFeed({ filter, pageSize: 20 });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Не удалось загрузить ленту');
      }
      return response.data;
    },
  });

  const createPostMutation = useMutation({
    mutationFn: () => createCommunityPost({
      postType,
      title: title.trim(),
      body: body.trim(),
    }),
    onSuccess: () => {
      showToast('Пост отправлен на модерацию', 'success');
      setTitle('');
      setBody('');
      setIsComposerOpen(false);
    },
    onError: (error: Error) => showToast(error.message || 'Не удалось отправить пост', 'error'),
  });

  const reactionMutation = useMutation({
    mutationFn: ({ item, active }: { item: CommunityFeedItem; active: boolean }) =>
      setCommunityReaction({
        targetType: itemTypeLabel(item.type) === 'Пост'
          ? 'Post'
          : itemTypeLabel(item.type) === 'Отзыв' ? 'Review' : 'CheckIn',
        targetId: item.id,
        reactionType: active ? null : 'Helpful',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community-feed'] }),
    onError: (error: Error) => showToast(error.message || 'Не удалось обновить реакцию', 'error'),
  });

  const selectFilter = (nextFilter: CommunityFeedFilter) => {
    if ((nextFilter === 'Following' || nextFilter === 'FollowedCities') && !requireAuth()) {
      return;
    }
    setFilter(nextFilter);
  };

  const openComposer = () => {
    if (!requireAuth()) return;
    setIsComposerOpen(true);
  };

  const submitPost = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Заполните заголовок и текст поста', 'error');
      return;
    }
    createPostMutation.mutate();
  };

  return (
    <main className="min-h-screen bg-[#1A1412] text-white">
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-5 sm:items-end sm:justify-between">
          <div>
            <p className="text-[#EAB308] text-xs font-bold uppercase tracking-[.12em]">CoffeePeek</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-[-.03em]">Сообщество</h1>
            <p className="mt-2 text-sm text-[#A39E93]">Обсуждайте кофе, делитесь находками и опытом.</p>
          </div>
          <button
            type="button"
            onClick={openComposer}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EAB308] px-4 py-3 text-sm font-bold text-[#1A1412] hover:bg-[#FACC15]"
          >
            <AppIcon name="edit_note" size={18} />
            Написать пост
          </button>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => selectFilter(value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === value
                  ? 'bg-[#EAB308] text-[#1A1412]'
                  : 'border border-[#3D2F28] bg-[#2D241F] text-[#A39E93] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isComposerOpen && (
          <form onSubmit={submitPost} className="mt-6 rounded-2xl border border-[#5A463B] bg-[#2D241F] p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">Новый пост</h2>
              <button type="button" onClick={() => setIsComposerOpen(false)} aria-label="Закрыть">
                <AppIcon name="close" size={20} />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              {POST_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPostType(value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${
                    postType === value ? 'bg-[#EAB308] text-[#1A1412]' : 'bg-[#1A1412] text-[#A39E93]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={120}
              placeholder="Заголовок"
              className="mt-4 w-full rounded-xl border border-[#3D2F28] bg-[#1A1412] px-4 py-3 text-sm outline-none placeholder:text-[#5C544F] focus:border-[#EAB308]"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              minLength={10}
              maxLength={2000}
              rows={5}
              placeholder="Поделитесь мыслью с сообществом"
              className="mt-3 w-full resize-y rounded-xl border border-[#3D2F28] bg-[#1A1412] px-4 py-3 text-sm outline-none placeholder:text-[#5C544F] focus:border-[#EAB308]"
            />
            <div className="mt-2 text-right text-xs text-[#A39E93]">{body.length}/2000</div>
            <button
              type="submit"
              disabled={createPostMutation.isPending}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#EAB308] px-4 py-3 text-sm font-bold text-[#1A1412] disabled:opacity-50"
            >
              <AppIcon name="send" size={17} />
              {createPostMutation.isPending ? 'Отправляем…' : 'Отправить на модерацию'}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-4">
          {feedQuery.isLoading && (
            <div className="rounded-2xl border border-[#3D2F28] bg-[#2D241F] p-6 text-[#A39E93]">Загружаем ленту…</div>
          )}
          {feedQuery.isError && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-200">
              {(feedQuery.error as Error).message}
            </div>
          )}
          {feedQuery.data?.items.map((item) => {
            const isHelpful = item.viewerReaction === 'Helpful' || item.viewerReaction === 3;
            return (
              <article key={`${item.type}-${item.id}`} className="rounded-2xl border border-[#3D2F28] bg-[#2D241F] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-[#EAB308]/15 px-2 py-1 font-bold text-[#EAB308]">{itemTypeLabel(item.type)}</span>
                      <span className="text-[#A39E93]">{new Date(item.createdAtUtc).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => item.userId && navigate(`/users/${item.userId}`)}
                      className="mt-3 text-left text-sm font-bold hover:text-[#EAB308]"
                    >
                      {item.username}
                    </button>
                    {item.shopName && <p className="mt-1 text-xs text-[#A39E93]">{item.shopName}</p>}
                  </div>
                </div>
                {item.header && <h2 className="mt-4 text-lg font-bold">{item.header}</h2>}
                {itemText(item) && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#D1CBC4]">{itemText(item)}</p>}
                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!requireAuth()) return;
                      reactionMutation.mutate({ item, active: isHelpful });
                    }}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                      isHelpful ? 'bg-[#EAB308]/15 text-[#EAB308]' : 'bg-[#1A1412] text-[#A39E93]'
                    }`}
                  >
                    <AppIcon name="thumb_up" filled={isHelpful} size={16} />
                    Полезно {item.reactions.helpful ?? 0}
                  </button>
                  <span className="inline-flex items-center gap-1 text-xs text-[#A39E93]">
                    <AppIcon name="rate_review" size={16} />
                    {item.commentCount}
                  </span>
                </div>
              </article>
            );
          })}
          {feedQuery.data && feedQuery.data.items.length === 0 && (
            <div className="rounded-2xl border border-[#3D2F28] bg-[#2D241F] p-10 text-center text-sm text-[#A39E93]">
              В этой категории пока нет публикаций.
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default CommunityPage;
