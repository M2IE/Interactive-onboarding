import { Link } from "react-router-dom";
import { appRoutes } from "@/shared/config/routes";

type ProductLogoProps = {
  subtitle?: string;
};

export function ProductLogo({ subtitle }: ProductLogoProps) {
  return (
    <Link
      aria-label={`Interactive Onboarding${subtitle ? `, ${subtitle}` : ""}`}
      className="product-logo"
      to={appRoutes.home}
    >
      <span className="product-logo__mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="product-logo__copy">
        <strong>
          Interactive <br />
          Onboarding
        </strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
    </Link>
  );
}
