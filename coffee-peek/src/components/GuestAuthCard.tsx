import React from 'react';
import { Link } from 'react-router-dom';

interface GuestAuthCardProps {
  surface: string;
  border: string;
  text: string;
  muted: string;
  gold: string;
}

const GuestAuthCard: React.FC<GuestAuthCardProps> = ({ surface, border, text, muted, gold }) => (
  <section className="rounded-[20px] border px-4 py-5 text-center sm:px-6" style={{ background: surface, borderColor: border }}>
    <p className="mx-auto max-w-[520px] text-sm leading-relaxed sm:text-base" style={{ color: text }}>
      Присоединяйтесь к сообществу, чтобы сохранять любимые места и делиться впечатлениями.
    </p>
    <Link to="/login" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full text-base font-bold" style={{ background: gold, color: '#1A1412' }}>
      Войти
    </Link>
    <div className="mt-3 flex min-h-11 flex-wrap items-center justify-center gap-x-2 text-sm">
      <span style={{ color: muted }}>Нет аккаунта?</span>
      <Link to="/register" className="font-bold" style={{ color: text }}>Зарегистрироваться</Link>
    </div>
  </section>
);

export default GuestAuthCard;
