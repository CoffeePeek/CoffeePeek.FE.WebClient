import { mockUserPosts } from '../data/mockData';
import { Heart, MessageCircle, Share2, Coffee, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

type UserPostsProps = {
  onBack: () => void;
};

export function UserPosts({ onBack }: UserPostsProps) {
  return (
    <div className="p-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft className="size-5 text-neutral-700 dark:text-neutral-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-neutral-900 dark:text-neutral-50">Мои посты</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Делитесь своими кофейными впечатлениями
          </p>
        </div>
      </div>

      {mockUserPosts.length === 0 ? (
        <div className="text-center py-12">
          <Coffee className="size-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            У вас пока нет постов
          </p>
          <Button className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700">
            Создать первый пост
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {mockUserPosts.map((post) => (
            <Card key={post.id} className="dark:bg-neutral-900 dark:border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                      АП
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-900 dark:text-neutral-50">Алексей Петров</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{post.date}</span>
                    </div>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{post.location}</span>
                  </div>
                </div>

                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                  />
                )}

                <p className="text-neutral-700 dark:text-neutral-300 mb-3">{post.content}</p>

                <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
                  <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <Heart className="size-5" />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                    <MessageCircle className="size-5" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                    <Share2 className="size-5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
