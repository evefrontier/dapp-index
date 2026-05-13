import { ForwardRefExoticComponent } from 'react';
import { HTMLAttributes } from 'react';
import { InputHTMLAttributes } from 'react';
import { JSX } from 'react/jsx-runtime';
import { JSXElementConstructor } from 'react';
import { MouseEventHandler } from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { ReactPortal } from 'react';
import { RefAttributes } from 'react';

/**
 * **Basic card** — marketing split layout with optional bracket frame.
 * Single media slot (no carousel in DS v1).
 *
 * @see `figmaWebBrandBasicCardUrl` in `src/constants/figma.ts`
 */
export declare function BasicCard({ header, subheader, children, buttonLeft, buttonRight, media, position, showBrackets, size, className, ...rest }: BasicCardProps): JSX.Element;

export declare namespace BasicCard {
    var displayName: string;
}

export declare interface BasicCardAction {
    label: string;
    href: string;
    external?: boolean;
}

export declare interface BasicCardMedia {
    src: string;
    alt: string;
}

export declare interface BasicCardProps extends HTMLAttributes<HTMLDivElement> {
    header?: string;
    subheader?: string;
    /** Body — plain text or HTML-ish paragraphs via nodes. */
    children?: ReactNode;
    buttonLeft?: BasicCardAction;
    buttonRight?: BasicCardAction;
    media?: BasicCardMedia;
    /** Media sits on the right on desktop by default; `left` flips the row. */
    position?: 'left' | 'right';
    showBrackets?: boolean;
    size?: 'default' | 'small';
}

/**
 * Brand **Button** — use this for new work instead of raw `<button>` styling.
 * Implements the Web — Brand Design System button spec; built on `WebsiteButton`
 * (site-parity styles, link + icon support).
 *
 * @see `figmaWebBrandButtonUrl` in `src/constants/figma.ts`
 */
export declare const Button: ForwardRefExoticComponent<Omit<WebsiteButtonProps, "theme"> & {
/** Brand naming aligned with Figma / design system (maps to WebsiteButton `theme`). */
variant?: ButtonVariant;
} & RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

/**
 * Group multiple library `Button` children with a shared bracket frame.
 * Uses the website-style grouped layout (no side rails between buttons).
 */
export declare const ButtonGroup: ForwardRefExoticComponent<ButtonGroupProps & RefAttributes<HTMLDivElement>>;

export declare interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    fullWidth?: boolean;
    orientation?: 'horizontal' | 'vertical';
    children: ReactNode;
}

export declare function ButtonGroupShowcase(): JSX.Element;

export declare type ButtonProps = Omit<WebsiteButtonProps, 'theme'> & {
    /** Brand naming aligned with Figma / design system (maps to WebsiteButton `theme`). */
    variant?: ButtonVariant;
};

/**
 * In-app matrix similar to the Figma Buttons frame: variant × size × disabled.
 */
export declare function ButtonShowcase(): JSX.Element;

export declare type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'special';

/**
 * Decorative frame used around **Basic** / **Product**-style cards on the site.
 * @see `website/src/components/brackets/Brackets.tsx`
 */
export declare function CardBrackets({ children, enabled, border, borderColor, cornerColor, }: CardBracketsProps): string | number | bigint | boolean | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | JSX.Element | null | undefined;

export declare interface CardBracketsProps {
    children: ReactNode;
    /** When false, render children only (no frame). */
    enabled?: boolean;
    /** Outer 1px border (website default). */
    border?: boolean;
    /** CSS border color for the frame (e.g. rgba). */
    borderColor?: string;
    /** Corner L-bracket color. */
    cornerColor?: string;
}

/**
 * **Card filter bar** — horizontal category buttons (primary = active, secondary = idle).
 * Pair with {@link BasicCard} or other card grids; host app owns filter state and data.
 *
 * @see `figmaWebBrandCardFilterUrl` in `src/constants/figma.ts`
 */
export declare function CardFilterBar({ value, onChange, options, allOption, className, 'aria-label': ariaLabel, ...rest }: CardFilterBarProps): JSX.Element;

export declare namespace CardFilterBar {
    var displayName: string;
}

export declare interface CardFilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /** Active option id (usually `allOption.id` or one of `options[].id`). */
    value: string;
    onChange: (nextId: string) => void;
    options: readonly CardFilterOption[];
    /** First chip — clears the filter when selected. Omit to hide. */
    allOption?: CardFilterOption;
}

/**
 * Interactive filter + {@link BasicCard} list aligned to the Figma “filter” frame.
 */
export declare function CardFilterBarShowcase(): JSX.Element;

export declare interface CardFilterOption {
    id: string;
    label: string;
}

export declare const Checkbox: ForwardRefExoticComponent<CheckboxProps & RefAttributes<HTMLInputElement>>;

export declare interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    label?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * **Main card** — header strip + padded body; matches site `MainCard` minus
 * animations, i18n links, and analytics.
 *
 * @see `figmaWebBrandMainCardUrl` in `src/constants/figma.ts`
 */
export declare const MainCard: ForwardRefExoticComponent<MainCardProps & RefAttributes<HTMLDivElement>>;

export declare interface MainCardAction {
    label: string;
    href: string;
    external?: boolean;
}

export declare interface MainCardProps extends HTMLAttributes<HTMLDivElement> {
    /** Top bar label (required for the main card pattern). */
    title: string;
    /** Short line under the title (e.g. uppercase label). */
    tagline?: ReactNode;
    /** Body copy — text or rich content. */
    children?: ReactNode;
    /** Primary row action (secondary button + link). */
    action?: MainCardAction;
}

/**
 * **Product card** — vertical pack / SKU tile with media, price, bullets, CTA.
 * No checkout wiring — pass `cta.href` from the host app.
 *
 * @see `figmaWebBrandProductCardUrl` in `src/constants/figma.ts`
 */
export declare const ProductCard: ForwardRefExoticComponent<ProductCardProps & RefAttributes<HTMLDivElement>>;

export declare interface ProductCardCta {
    label: string;
    href: string;
    external?: boolean;
}

export declare interface ProductCardMedia {
    src: string;
    alt: string;
}

export declare interface ProductCardProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    subheader?: string;
    price?: string;
    attributes?: string[];
    media?: ProductCardMedia;
    /** e.g. “Best value” — top-right pill. */
    badge?: string;
    highlighted?: boolean;
    /** Border / emphasis tier (matches founder pack themes). */
    theme?: 'primary' | 'secondary';
    cta: ProductCardCta;
    /** Optional slot above CTA (e.g. legal footnote). */
    footer?: ReactNode;
}

export declare const Radio: ForwardRefExoticComponent<RadioProps & RefAttributes<HTMLInputElement>>;

export declare interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    label?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Checkbox, radio, and toggle examples from the shared Figma frame.
 */
export declare function SelectionControlsShowcase(): JSX.Element;

/**
 * Tag / pill for labels and taxonomy chips.
 * Mirrors website `TagPill` visuals while remaining presentational.
 */
export declare const Tag: ForwardRefExoticComponent<TagProps & RefAttributes<HTMLDivElement>>;

export declare interface TagProps extends HTMLAttributes<HTMLDivElement> {
    text?: string;
    variant?: TagVariant;
    size?: TagSize;
    weight?: TagWeight;
}

export declare function TagShowcase(): JSX.Element;

export declare type TagSize = 'small' | 'medium' | 'large';

export declare type TagVariant = 'primary' | 'secondary' | 'tertiary';

export declare type TagWeight = 'regular' | 'bold';

/**
 * Brand **TextField** — label, native input, helper or error line.
 *
 * @see `figmaWebBrandTextFieldUrl` and `figmaWebBrandTextFieldUsageUrl` in `src/constants/figma.ts`
 */
export declare const TextField: ForwardRefExoticComponent<TextFieldProps & RefAttributes<HTMLInputElement>>;

export declare interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

/**
 * Examples + “how to use” notes aligned to Figma text-field frames.
 */
export declare function TextFieldShowcase(): JSX.Element;

/**
 * Toast component - CCP Games Design System
 *
 * Notification toast matching Figma design:
 * - Dark gray background with white borders (top, right, bottom)
 * - Left accent border (orange for default, magenta for error)
 * - Bold uppercase title, regular message text
 */
export declare const Toast: ForwardRefExoticComponent<ToastProps & RefAttributes<HTMLDivElement>>;

export declare interface ToastProps extends HTMLAttributes<HTMLDivElement> {
    /** Toast variant */
    variant?: 'default' | 'error';
    /** Toast title */
    title?: string;
    /** Toast message */
    message?: string;
    /** Show close button */
    dismissible?: boolean;
    /** Callback when dismissed */
    onDismiss?: () => void;
}

/**
 * Toast examples from Figma (interim `figma-export` implementation until a library CSS migration).
 */
export declare function ToastShowcase(): JSX.Element;

export declare const Toggle: ForwardRefExoticComponent<ToggleProps & RefAttributes<HTMLInputElement>>;

export declare interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    label?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Reference for shared type roles — matches `src/tokens/typography.css` and library form components.
 */
export declare function TypographyShowcase(): JSX.Element;

/**
 * Website `Button` migrated for the design system: same theme/size naming, no Next.js,
 * router, i18n, `dataLayer`, or `Label` child — consumers handle analytics and localization.
 *
 * @see `website/src/components/button/Button.tsx` (source)
 * @see `src/migration/figma-export-website-map.json` entry `button`
 */
export declare const WebsiteButton: ForwardRefExoticComponent<WebsiteButtonProps & RefAttributes<HTMLButtonElement | HTMLAnchorElement>>;

export declare type WebsiteButtonIcon = {
    url: string;
    width?: number;
    height?: number;
} | ReactElement;

export declare interface WebsiteButtonProps {
    /** Matches website `Button` — note `tartiary` spelling from Figma export / legacy site. */
    theme?: WebsiteButtonTheme;
    size?: WebsiteButtonSize;
    fill?: boolean;
    hovered?: boolean;
    disabled?: boolean;
    href?: string;
    /** When `href` is set and `external` is true, renders `target="_blank"` + `rel`. */
    external?: boolean;
    icon?: WebsiteButtonIcon;
    iconPosition?: 'left' | 'right';
    /** Native tooltip (website used `Tooltip` component). */
    tooltip?: string;
    children?: ReactNode;
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
    type?: 'button' | 'submit' | 'reset';
}

export declare type WebsiteButtonSize = 'large' | 'medium' | 'small' | 'landing' | 'icon' | 'fill' | 'default' | 'desktopLarge';

export declare type WebsiteButtonTheme = 'primary' | 'secondary' | 'tartiary' | 'special';

export { }
