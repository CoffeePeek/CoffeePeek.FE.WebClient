import React from 'react';
import type { AddressKind } from '../api/publicAddresses';
import { usePublicNavigate } from '../hooks/usePublicNavigate';
export default function PublicEntityLink({ kind, entityId, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind: AddressKind; entityId: string }) {
  const open = usePublicNavigate();
  return <button type="button" {...props} onClick={() => { void open(kind, entityId); }}>{children}</button>;
}
