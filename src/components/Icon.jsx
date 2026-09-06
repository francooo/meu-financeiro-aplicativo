import Svg, { Path } from "react-native-svg";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Calculator, Car, Check,
  ChevronDown, ChevronUp, CreditCard, DollarSign, FileText, Gamepad2,
  GraduationCap, HandCoins, HeartPulse, History, Home, Landmark, Lightbulb,
  LogOut, Pencil, PiggyBank, Plus, Repeat, Search, Shirt, ShoppingCart,
  Smartphone, Tag, Trash2, Wallet, X,
} from "lucide-react-native";

/**
 * Resolve identificadores de ícone (string) para componentes.
 *
 * É o que permite src/lib/domain.js ser dado puro. No web, CATS,
 * PAYMENT_METHOD_META e SERASA_CATS guardavam COMPONENTES React dentro do
 * campo `icon` (_reference/meu-caixa.jsx, 12-82), o que amarrava os dados de
 * domínio à camada de UI e impedia reaproveitá-los em qualquer outro lugar.
 */

const LUCIDE = {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Calculator, Car, Check,
  ChevronDown, ChevronUp, CreditCard, DollarSign, FileText, Gamepad2,
  GraduationCap, HandCoins, HeartPulse, History, Home, Landmark, Lightbulb,
  LogOut, Pencil, PiggyBank, Plus, Repeat, Search, Shirt, ShoppingCart,
  Smartphone, Tag, Trash2, Wallet, X,
};

/* ---------- ícones de marca ----------
   Portados dos SVGs próprios do web (linhas 44-64). Em React Native não existe
   <svg>/<path>, então usam react-native-svg. Fonte: simple-icons.org. */

const BRAND_PATHS = {
  pix: "M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156",
  nubank: "M7.2795 5.4336c-1.1815 0-2.1846.4628-2.9432 1.252h-.002c-.0541-.0022-.1074-.002-.162-.002-1.5436 0-2.9925.8835-3.699 2.2559-.3088.5996-.4234 1.2442-.459 1.9003-.0321.589 0 1.1863 0 1.7696v5.6523H3.184s.0022-2.784 0-5.1777c-.0014-1.6112-.0118-3.0471 0-3.3418.056-1.3937.4372-2.3053 1.1484-3.0508 2.3585.0018 3.8852 1.6091 3.9705 4.168.0196.5874.0254 3.7304.0254 3.7304v3.672h3.1678v-4.965c0-1.5007.0127-2.8006-.0918-3.6952-.292-2.5-1.821-4.168-4.1248-4.168zm8.3903.3008l-3.166.0039v4.9648c0 1.5009-.0127 2.8007.0919 3.6953.2921 2.5001 1.821 4.168 4.1248 4.168 1.1815 0 2.1846-.4628 2.9432-1.252.0003-.0003.0016.0004.002 0 .0542.0023.1093.002.164.002 1.5435 0 2.9905-.8835 3.6971-2.2558.3088-.5997.4233-1.2442.459-1.9004.032-.5889 0-1.1862 0-1.7695V5.7383H20.816s-.0022 2.784 0 5.1777c.0015 1.6113.0119 3.047 0 3.3418-.056 1.3935-.4372 2.3053-1.1483 3.0508-2.3586-.0018-3.8853-1.6091-3.9706-4.168-.0196-.5874-.0273-2.0437-.0273-3.7324Z",
  samsclub: "m14.275 1.71 9.403 9.504a1.119 1.119 0 0 1 .001 1.569l-9.401 9.507-1.624-1.64a1.136 1.136 0 0 1 0-1.596L19.631 12l-6.917-6.99a1.225 1.225 0 0 1 0-1.72l1.56-1.579zm-3.026 1.572L9.695 1.71.34 11.17a1.186 1.186 0 0 0 0 1.663l9.356 9.457 1.553-1.57a1.237 1.237 0 0 0 0-1.737L4.341 12l6.909-6.985a1.235 1.235 0 0 0-.001-1.734z",
};

function BrandIcon({ name, size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d={BRAND_PATHS[name]} />
    </Svg>
  );
}

/**
 * @param {string} name  id do ícone: nome do lucide ("Home") ou marca ("pix")
 */
export function Icon({ name, size = 20, color = "#1E293B", strokeWidth = 2 }) {
  if (BRAND_PATHS[name]) return <BrandIcon name={name} size={size} color={color} />;

  const Cmp = LUCIDE[name] || Tag;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} />;
}
