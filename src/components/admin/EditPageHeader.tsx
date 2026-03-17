import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface EditPageHeaderProps {
  title: string;
  subtitle: string;
  breadcrumbs: Breadcrumb[];
}

export default function EditPageHeader({ title, subtitle, breadcrumbs }: EditPageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {title}{' '}
          <span className="text-lg font-normal text-foreground/50">{subtitle}</span>
        </h1>

        <nav className="flex items-center gap-1 text-sm pt-1">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {crumb.href ? (
                <Link href={crumb.href} className="text-accent hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-accent">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="mt-4 border-b border-card-border" />
    </div>
  );
}
