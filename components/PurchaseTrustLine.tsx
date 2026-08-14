export const PURCHASE_TRUST =
  "£19 once · 3 Macs · lifetime updates · 14-day trial · 14-day money-back guarantee · clipboard stays local";

export default function PurchaseTrustLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-relaxed ink-3 text-pretty ${className}`}>
      {PURCHASE_TRUST}
    </p>
  );
}
