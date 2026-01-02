import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'open' | 'closed' | 'paid' | 'unpaid' | 'disponible' | 'plein' | 'indisponible';
  className?: string;
}

const statusConfig = {
  open: { label: 'Ouvert', className: 'status-open' },
  closed: { label: 'Fermé', className: 'status-closed' },
  paid: { label: 'Payé', className: 'status-paid' },
  unpaid: { label: 'Non payé', className: 'status-unpaid' },
  disponible: { label: 'Disponible', className: 'bg-emerald-100 text-emerald-800' },
  plein: { label: 'Plein', className: 'bg-amber-100 text-amber-800' },
  indisponible: { label: 'Indisponible', className: 'bg-gray-100 text-gray-800' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn('status-badge', config.className, className)}>
      {config.label}
    </span>
  );
}
