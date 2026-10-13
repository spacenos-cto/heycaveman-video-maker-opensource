import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'sticker bg-ochre text-[#1F1A17] font-display font-semibold',
  secondary: 'sticker bg-bone text-charcoal font-display font-semibold',
  ghost: 'rounded-[12px] text-terracotta font-display font-semibold underline-offset-4 hover:underline',
};

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
