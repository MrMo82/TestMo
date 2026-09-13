import React, { useState } from 'react';
import { HAYS_BRAND_ASSETS, PRODUCT_NAME } from '../theme/brand';

type LogoVariant = 'primary' | 'symbol' | 'reversed';

interface BrandLogoProps {
  variant?: LogoVariant;
  className?: string;
  /** Zeigt zusaetzlich den Produktnamen als Text neben dem Symbol (z.B. im Header). */
  showProductName?: boolean;
}

const pathForVariant = (variant: LogoVariant): string => {
  if (variant === 'symbol') return HAYS_BRAND_ASSETS.symbolLogo;
  if (variant === 'reversed') return HAYS_BRAND_ASSETS.reversedLogo;
  return HAYS_BRAND_ASSETS.primaryLogo;
};

/**
 * Rendert ausschliesslich offiziell freigegebene Hays-Logoassets (Abschnitt FF).
 * Es wird kein Logo nachgezeichnet, eingefaerbt oder invertiert. Solange keine
 * freigegebene Asset-Datei unter dem konfigurierten Pfad existiert, faellt die
 * Komponente auf einen reinen Textnamen zurueck, statt fehlzuschlagen oder ein
 * eigenes Ersatzlogo zu erzeugen (AC-BRAND-11/12/13).
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ variant = 'symbol', className = '', showProductName = false }) => {
  const [assetMissing, setAssetMissing] = useState(false);
  const isDarkSurface = variant === 'reversed';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!assetMissing ? (
        <img
          src={pathForVariant(variant)}
          alt={HAYS_BRAND_ASSETS.altText}
          onError={() => setAssetMissing(true)}
          className="h-8 w-auto"
        />
      ) : (
        <span
          className={`rounded-lg px-2 py-1 text-sm font-bold ${isDarkSurface ? 'bg-white/10 text-white' : 'bg-[color:var(--color-action-primary)]/10 text-[color:var(--color-action-primary)]'}`}
          aria-label={PRODUCT_NAME}
          title="Offizielles Hays-Logo folgt, sobald das Asset bereitgestellt ist."
        >
          {HAYS_BRAND_ASSETS.altText}
        </span>
      )}
      {showProductName && (
        <span className={`font-bold tracking-tight ${isDarkSurface ? 'text-white' : 'text-[color:var(--color-text-primary)]'}`}>
          {PRODUCT_NAME}
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
