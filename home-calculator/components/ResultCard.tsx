'use client';

interface ResultCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
}

export default function ResultCard({
  title,
  children,
  className = 'from-blue-600 to-emerald-600',
  icon,
}: ResultCardProps) {
  return (
    <div
      className={`bg-gradient-to-br ${className} rounded-lg p-6 text-white shadow-lg`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
