import "./index.css";
import { jsxs as r, jsx as e } from "react/jsx-runtime";
import { forwardRef as v, isValidElement as le, Children as Z, cloneElement as ve, useState as R, useMemo as Ne, useId as A } from "react";
function oe(a) {
  var l, o, t = "";
  if (typeof a == "string" || typeof a == "number") t += a;
  else if (typeof a == "object") if (Array.isArray(a)) {
    var n = a.length;
    for (l = 0; l < n; l++) a[l] && (o = oe(a[l])) && (t && (t += " "), t += o);
  } else for (o in a) a[o] && (t && (t += " "), t += o);
  return t;
}
function d() {
  for (var a, l, o = 0, t = "", n = arguments.length; o < n; o++) (a = arguments[o]) && (l = oe(a)) && (t && (t += " "), t += l);
  return t;
}
const xe = "_root_1m24h_8", we = "_contents_1m24h_68", Ce = "_label_1m24h_148", Se = "_icon_1m24h_201", $e = "_iconLeft_1m24h_214", ke = "_iconRight_1m24h_218", ze = "_hoverLayer_1m24h_222", Le = "_hoverFill_1m24h_230", C = {
  root: xe,
  contents: we,
  label: Ce,
  icon: Se,
  iconLeft: $e,
  iconRight: ke,
  hoverLayer: ze,
  hoverFill: Le
};
function Te(a) {
  if (typeof a == "string") return a;
  if (typeof a == "number") return String(a);
  if (le(a) && typeof a.props == "object" && a.props !== null && "children" in a.props) {
    const l = a.props.children;
    if (typeof l == "string") return l;
  }
  return "";
}
function Fe(a) {
  return a === "icon" || a === "fill" || a === "default" || a === "desktopLarge" ? "medium" : a === "landing" ? "landing" : a === "large" ? "large" : a === "small" ? "small" : "medium";
}
function De(a) {
  return a === "small" ? 16 : a === "medium" || a === "icon" || a === "fill" || a === "default" || a === "desktopLarge" ? 18 : 20;
}
function ee(a) {
  return typeof a == "object" && a !== null && "url" in a;
}
const ne = v(
  function({
    theme: l = "primary",
    size: o = "medium",
    hovered: t = !1,
    fill: n = !1,
    disabled: i = !1,
    href: m,
    external: h = !1,
    icon: c,
    iconPosition: u = "left",
    tooltip: p,
    children: f,
    className: g,
    onClick: y,
    type: z = "button"
  }, E) {
    const fe = Fe(o), _e = Te(f), G = De(o), be = !!m, ye = (Q) => {
      if (i) {
        Q.preventDefault();
        return;
      }
      y?.(Q);
    }, X = /* @__PURE__ */ r("span", { className: C.contents, children: [
      c && u === "left" ? /* @__PURE__ */ e("span", { className: d(C.icon, C.iconLeft), children: ee(c) ? /* @__PURE__ */ e(
        "img",
        {
          src: c.url,
          alt: "",
          width: c.width ?? G,
          height: c.height ?? G
        }
      ) : c }) : null,
      /* @__PURE__ */ e("span", { className: C.label, "data-text": _e, children: f }),
      c && u === "right" ? /* @__PURE__ */ e("span", { className: d(C.icon, C.iconRight), children: ee(c) ? /* @__PURE__ */ e(
        "img",
        {
          src: c.url,
          alt: "",
          width: c.width ?? G,
          height: c.height ?? G
        }
      ) : c }) : null,
      /* @__PURE__ */ e("span", { className: C.hoverLayer, "aria-hidden": !0, children: /* @__PURE__ */ e("span", { className: C.hoverFill }) })
    ] }), J = d(C.root, n ? "w-full" : "w-fit", g), K = {
      "data-theme": l,
      "data-size": fe,
      "data-hovered": t ? "true" : "false",
      "data-disabled": i ? "true" : "false",
      "data-fill": n ? "true" : "false"
    };
    return be ? /* @__PURE__ */ e(
      "a",
      {
        ref: E,
        href: m,
        className: J,
        title: p,
        "aria-disabled": i || void 0,
        onClick: ye,
        target: h ? "_blank" : void 0,
        rel: h ? "noopener noreferrer" : void 0,
        ...K,
        children: X
      }
    ) : /* @__PURE__ */ e(
      "button",
      {
        ref: E,
        type: z,
        className: J,
        title: p,
        disabled: i,
        onClick: y,
        ...K,
        children: X
      }
    );
  }
);
ne.displayName = "WebsiteButton";
const Be = {
  primary: "primary",
  secondary: "secondary",
  tertiary: "tartiary",
  special: "special"
}, _ = v(
  function({ variant: l = "primary", ...o }, t) {
    return /* @__PURE__ */ e(ne, { ref: t, theme: Be[l], ...o });
  }
);
_.displayName = "Button";
const k = "https://www.figma.com/design/okyV5oqokzWDAO7a6j4w4a/Web---Brand-Design-System", ie = "2005-575", Ie = `${k}?node-id=${ie}&m=dev`, se = "2005-373", Me = `${k}?node-id=${se}&m=dev`, ce = "2005-606", We = `${k}?node-id=${ce}&m=dev`, je = "2356-164407", Re = `${k}?node-id=${je}&m=dev`, de = "4307-8673", Ae = `${k}?node-id=${de}&m=dev`, me = "2006-73", Ee = `${k}?node-id=${me}&m=dev`, he = "2006-88", Ge = `${k}?node-id=${he}&m=dev`, ue = "2009-866", Oe = `${k}?node-id=${ue}&m=dev`, P = "text-[var(--color-muted)] w-20 shrink-0 text-xs font-[var(--font-family-mono)] uppercase tracking-wider", q = "flex flex-wrap items-center gap-4 gap-y-3", Pe = "text-[var(--color-foreground)] font-[var(--font-family-mono)] uppercase tracking-wider text-sm mb-4", qe = "grid gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,15.5rem),1fr))]", Ue = ["small", "medium", "large"], He = [
  { variant: "primary", title: "Primary" },
  { variant: "secondary", title: "Secondary" },
  { variant: "tertiary", title: "Tertiary" },
  { variant: "special", title: "Special" }
];
function Hr() {
  return /* @__PURE__ */ r("div", { className: "space-y-10", children: [
    /* @__PURE__ */ r("p", { className: "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl", children: [
      "Layout mirrors the",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Ie,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Buttons"
        }
      ),
      " ",
      "frame in Figma (node ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: ie }),
      ")."
    ] }),
    /* @__PURE__ */ e("div", { className: qe, children: He.map(({ variant: a, title: l }) => /* @__PURE__ */ r("section", { className: "min-w-0", "aria-labelledby": `btn-show-${a}`, children: [
      /* @__PURE__ */ e("h3", { id: `btn-show-${a}`, className: Pe, children: l }),
      /* @__PURE__ */ r("div", { className: "flex flex-col gap-3", children: [
        Ue.map((o) => /* @__PURE__ */ r("div", { className: q, children: [
          /* @__PURE__ */ e("span", { className: P, children: o }),
          /* @__PURE__ */ e(_, { variant: a, size: o, children: "Button" })
        ] }, o)),
        /* @__PURE__ */ r("div", { className: q, children: [
          /* @__PURE__ */ e("span", { className: P, children: "Disabled" }),
          /* @__PURE__ */ e(_, { variant: a, size: "medium", disabled: !0, children: "Button" })
        ] }),
        /* @__PURE__ */ r("div", { className: q, children: [
          /* @__PURE__ */ e("span", { className: P, children: "Link" }),
          /* @__PURE__ */ e(_, { variant: a, size: "medium", href: "https://www.ccpgames.com", external: !0, children: "Link" })
        ] })
      ] })
    ] }, a)) })
  ] });
}
const Ye = "_root_1besi_1", Ve = "_fullWidth_1besi_9", Xe = "_vertical_1besi_13", Je = "_framePrimary_1besi_34", Ke = "_frameSecondary_1besi_38", Qe = "_frameTertiary_1besi_39", Ze = "_frameSpecial_1besi_43", L = {
  root: Ye,
  fullWidth: Ve,
  vertical: Xe,
  framePrimary: Je,
  frameSecondary: Ke,
  frameTertiary: Qe,
  frameSpecial: Ze
}, j = v(function({ variant: l = "primary", size: o = "medium", fullWidth: t = !1, orientation: n = "horizontal", className: i, children: m, ...h }, c) {
  const u = Z.count(m), p = Z.map(m, (g, y) => !le(g) || g.type !== _ ? g : ve(g, {
    variant: g.props.variant ?? l,
    size: g.props.size ?? o,
    fill: g.props.fill ?? t,
    className: d(
      g.props.className,
      y < u - 1 && n === "horizontal" && "rounded-r-none",
      y > 0 && n === "horizontal" && "rounded-l-none",
      y < u - 1 && n === "vertical" && "rounded-b-none",
      y > 0 && n === "vertical" && "rounded-t-none"
    )
  })), f = l === "secondary" ? L.frameSecondary : l === "tertiary" ? L.frameTertiary : l === "special" ? L.frameSpecial : L.framePrimary;
  return /* @__PURE__ */ e(
    "div",
    {
      ref: c,
      role: "group",
      className: d(
        L.root,
        f,
        n === "vertical" && L.vertical,
        t && L.fullWidth,
        i
      ),
      ...h,
      children: p
    }
  );
});
j.displayName = "ButtonGroup";
const ea = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl mb-8", aa = "flex flex-col gap-8 max-w-5xl", U = "ds-type-label mb-4";
function Yr() {
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("p", { className: ea, children: [
      "Groups library ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "Button" }),
      " instances with a shared bracket frame and no vertical rails between adjacent items."
    ] }),
    /* @__PURE__ */ r("div", { className: aa, children: [
      /* @__PURE__ */ r("section", { children: [
        /* @__PURE__ */ e("h3", { className: U, children: "Horizontal" }),
        /* @__PURE__ */ r("div", { className: "flex flex-wrap gap-6 items-start", children: [
          /* @__PURE__ */ r(j, { variant: "primary", children: [
            /* @__PURE__ */ e(_, { children: "First" }),
            /* @__PURE__ */ e(_, { children: "Second" }),
            /* @__PURE__ */ e(_, { children: "Third" })
          ] }),
          /* @__PURE__ */ r(j, { variant: "secondary", children: [
            /* @__PURE__ */ e(_, { children: "First" }),
            /* @__PURE__ */ e(_, { children: "Second" }),
            /* @__PURE__ */ e(_, { children: "Third" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ r("section", { children: [
        /* @__PURE__ */ e("h3", { className: U, children: "Vertical" }),
        /* @__PURE__ */ r(j, { variant: "primary", orientation: "vertical", children: [
          /* @__PURE__ */ e(_, { children: "Alpha" }),
          /* @__PURE__ */ e(_, { children: "Omega" }),
          /* @__PURE__ */ e(_, { children: "Deploy" })
        ] })
      ] }),
      /* @__PURE__ */ r("section", { children: [
        /* @__PURE__ */ e("h3", { className: U, children: "Full width" }),
        /* @__PURE__ */ e("div", { className: "max-w-xl", children: /* @__PURE__ */ r(j, { variant: "special", fullWidth: !0, children: [
          /* @__PURE__ */ e(_, { children: "Monthly" }),
          /* @__PURE__ */ e(_, { children: "Yearly" })
        ] }) })
      ] })
    ] })
  ] });
}
const ra = "_frame_1c04n_5", ta = "_frameBordered_1c04n_12", la = "_corner_1c04n_16", oa = "_topLeft_1c04n_26", na = "_topRight_1c04n_32", ia = "_bottomLeft_1c04n_38", sa = "_bottomRight_1c04n_44", N = {
  frame: ra,
  frameBordered: ta,
  corner: la,
  topLeft: oa,
  topRight: na,
  bottomLeft: ia,
  bottomRight: sa
};
function ca({
  children: a,
  enabled: l = !0,
  border: o = !0,
  borderColor: t = "rgba(250, 250, 229, 0.2)",
  cornerColor: n = "#fafae5"
}) {
  return l ? /* @__PURE__ */ r("div", { style: {
    "--card-bracket-corner": n,
    borderColor: t
  }, className: d(N.frame, o && N.frameBordered), children: [
    /* @__PURE__ */ e("span", { className: d(N.corner, N.topLeft), "aria-hidden": !0 }),
    /* @__PURE__ */ e("span", { className: d(N.corner, N.topRight), "aria-hidden": !0 }),
    /* @__PURE__ */ e("span", { className: d(N.corner, N.bottomRight), "aria-hidden": !0 }),
    /* @__PURE__ */ e("span", { className: d(N.corner, N.bottomLeft), "aria-hidden": !0 }),
    a
  ] }) : a;
}
const da = "_root_1welw_5", ma = "_header_1welw_25", ha = "_title_1welw_37", ua = "_body_1welw_45", pa = "_tagline_1welw_55", ga = "_copy_1welw_65", fa = "_action_1welw_81", T = {
  root: da,
  header: ma,
  title: ha,
  body: ua,
  tagline: pa,
  copy: ga,
  action: fa
}, _a = v(function({ title: l, tagline: o, children: t, action: n, className: i, ...m }, h) {
  return /* @__PURE__ */ r("div", { ref: h, className: d(T.root, i), ...m, children: [
    /* @__PURE__ */ e("div", { className: T.header, children: /* @__PURE__ */ e("h3", { className: T.title, children: l }) }),
    /* @__PURE__ */ r("div", { className: T.body, children: [
      o ? /* @__PURE__ */ e("div", { className: T.tagline, children: o }) : null,
      t ? /* @__PURE__ */ e("div", { className: T.copy, children: t }) : null,
      n ? /* @__PURE__ */ e("div", { className: T.action, children: /* @__PURE__ */ e(_, { variant: "secondary", size: "medium", href: n.href, external: n.external, children: n.label }) }) : null
    ] })
  ] });
});
_a.displayName = "MainCard";
const ba = "_outer_87qjc_4", ya = "_inner_87qjc_14", va = "_innerDefault_87qjc_25", Na = "_innerRight_87qjc_35", xa = "_innerLeft_87qjc_39", wa = "_innerSmall_87qjc_44", Ca = "_padded_87qjc_49", Sa = "_copyColumn_87qjc_53", $a = "_copyColumnWide_87qjc_64", ka = "_headerGroup_87qjc_70", za = "_blockGap_87qjc_76", La = "_heading_87qjc_82", Ta = "_subheader_87qjc_91", Fa = "_copy_87qjc_53", Da = "_actions_87qjc_115", Ba = "_mediaColumn_87qjc_122", Ia = "_mediaColumnWide_87qjc_135", Ma = "_mediaFrame_87qjc_140", Wa = "_mediaImg_87qjc_148", b = {
  outer: ba,
  inner: ya,
  innerDefault: va,
  innerRight: Na,
  innerLeft: xa,
  innerSmall: wa,
  padded: Ca,
  copyColumn: Sa,
  copyColumnWide: $a,
  headerGroup: ka,
  blockGap: za,
  heading: La,
  subheader: Ta,
  copy: Fa,
  actions: Da,
  mediaColumn: Ba,
  mediaColumnWide: Ia,
  mediaFrame: Ma,
  mediaImg: Wa
};
function pe({
  header: a,
  subheader: l,
  children: o,
  buttonLeft: t,
  buttonRight: n,
  media: i,
  position: m = "right",
  showBrackets: h = !0,
  size: c = "default",
  className: u,
  ...p
}) {
  const f = c === "default", g = /* @__PURE__ */ r(
    "div",
    {
      className: d(
        b.inner,
        f ? b.innerDefault : b.innerSmall,
        f && m === "left" && b.innerLeft,
        f && m === "right" && b.innerRight,
        h && b.padded
      ),
      children: [
        /* @__PURE__ */ r("div", { className: d(b.copyColumn, f && b.copyColumnWide), children: [
          (a || l) && /* @__PURE__ */ r("div", { className: b.headerGroup, children: [
            a ? /* @__PURE__ */ e("h3", { className: b.heading, children: a }) : null,
            l ? /* @__PURE__ */ e("p", { className: b.subheader, children: l }) : null
          ] }),
          /* @__PURE__ */ r("div", { className: b.blockGap, children: [
            o ? /* @__PURE__ */ e("div", { className: b.copy, children: o }) : null,
            (t || n) && /* @__PURE__ */ r("div", { className: b.actions, children: [
              t ? /* @__PURE__ */ e(_, { variant: "secondary", size: "medium", href: t.href, external: t.external, children: t.label }) : null,
              n ? /* @__PURE__ */ e(_, { variant: "secondary", size: "medium", href: n.href, external: n.external, children: n.label }) : null
            ] })
          ] })
        ] }),
        i ? /* @__PURE__ */ e("div", { className: d(b.mediaColumn, f && b.mediaColumnWide), children: /* @__PURE__ */ e("div", { className: b.mediaFrame, children: /* @__PURE__ */ e("img", { className: b.mediaImg, src: i.src, alt: i.alt, loading: "lazy" }) }) }) : null
      ]
    }
  );
  return /* @__PURE__ */ e("div", { className: d(b.outer, u), ...p, children: /* @__PURE__ */ e(ca, { enabled: h, children: g }) });
}
pe.displayName = "BasicCard";
const ja = "_root_1yl8a_4", Ra = {
  root: ja
}, Aa = { id: "all", label: "All" };
function ge({
  value: a,
  onChange: l,
  options: o,
  allOption: t = Aa,
  className: n,
  "aria-label": i = "Filter content",
  ...m
}) {
  const h = t ? [t, ...o] : [...o];
  return /* @__PURE__ */ e("div", { className: d(Ra.root, n), role: "group", "aria-label": i, ...m, children: h.map((c) => {
    const u = a === c.id;
    return /* @__PURE__ */ e(
      _,
      {
        type: "button",
        variant: u ? "primary" : "secondary",
        size: "medium",
        onClick: () => l(c.id),
        children: c.label
      },
      c.id
    );
  }) });
}
ge.displayName = "CardFilterBar";
const Ea = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl";
function O(a) {
  return {
    src: "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect fill='${a}' width='100%' height='100%'/><text x='50%' y='50%' fill='#0B0B0B' font-size='18' font-family='ui-monospace' text-anchor='middle' dominant-baseline='middle'>Media</text></svg>`
    ),
    alt: "Placeholder media"
  };
}
const Ga = [
  { id: "marketing", label: "Marketing" },
  { id: "community", label: "Community" },
  { id: "patch-notes", label: "Patch notes" }
], ae = [
  {
    id: "1",
    tag: "marketing",
    header: "Capsuleer communication",
    subheader: "Marketing",
    media: O("#c45c26"),
    body: /* @__PURE__ */ e("p", { children: "Newsletter signup and campaign highlights — same shell as the Basic card spec." })
  },
  {
    id: "2",
    tag: "community",
    header: "Fanfest recap",
    subheader: "Community",
    media: O("#6b6b5e"),
    body: /* @__PURE__ */ e("p", { children: "Player stories and event photos; filter keeps long grids scannable." })
  },
  {
    id: "3",
    tag: "patch-notes",
    header: "April release",
    subheader: "Patch notes",
    media: O("#3d3d38"),
    body: /* @__PURE__ */ e("p", { children: "Balance changes and fixes; pair this strip with your CMS categories." })
  },
  {
    id: "4",
    tag: "marketing",
    header: "Merch drop",
    subheader: "Marketing",
    media: O("#8b4513"),
    body: /* @__PURE__ */ e("p", { children: "Another marketing row to show multiple hits under one chip." })
  }
];
function Vr() {
  const [a, l] = R("all"), o = Ne(() => a === "all" ? [...ae] : ae.filter((t) => t.tag === a), [a]);
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("p", { className: `${Ea} mb-6`, children: [
      "Figma (node ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: de }),
      "):",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Ae,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Filter"
        }
      ),
      ". Uses library ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "Button" }),
      " chips and",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Re,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Basic card"
        }
      ),
      " ",
      "for the filtered results."
    ] }),
    /* @__PURE__ */ e(ge, { value: a, onChange: l, options: Ga }),
    /* @__PURE__ */ e("div", { className: "flex flex-col gap-12 mt-4", children: o.map((t, n) => /* @__PURE__ */ e(
      pe,
      {
        header: t.header,
        subheader: t.subheader,
        media: t.media,
        position: n % 2 === 0 ? "right" : "left",
        buttonLeft: { label: "Read more", href: "https://www.ccpgames.com", external: !0 },
        children: t.body
      },
      t.id
    )) })
  ] });
}
const Oa = "_field_1niau_1", Pa = "_input_1niau_8", qa = "_sizeSm_1niau_33", Ua = "_sizeMd_1niau_38", Ha = "_sizeLg_1niau_43", Ya = "_label_1niau_48", Va = "_labelDisabled_1niau_53", Xa = "_helper_1niau_58", Ja = "_helperFull_1niau_62", Ka = "_checkbox_1niau_66", Qa = "_radio_1niau_67", Za = "_toggleInput_1niau_72", er = "_toggleWrap_1niau_84", ar = "_toggleDisabled_1niau_90", rr = "_track_1niau_95", tr = "_thumb_1niau_107", lr = "_toggleSm_1niau_116", or = "_toggleMd_1niau_126", nr = "_toggleLg_1niau_136", ir = "_thumbSm_1niau_157", sr = "_thumbMd_1niau_161", cr = "_thumbLg_1niau_165", s = {
  field: Oa,
  input: Pa,
  sizeSm: qa,
  sizeMd: Ua,
  sizeLg: Ha,
  label: Ya,
  labelDisabled: Va,
  helper: Xa,
  helperFull: Ja,
  checkbox: Ka,
  radio: Qa,
  toggleInput: Za,
  toggleWrap: er,
  toggleDisabled: ar,
  track: rr,
  thumb: tr,
  toggleSm: lr,
  toggleMd: or,
  toggleLg: nr,
  thumbSm: ir,
  thumbMd: sr,
  thumbLg: cr
}, D = v(function({ label: l, helperText: o, size: t = "md", className: n, disabled: i, id: m, ...h }, c) {
  const u = A(), p = m ?? `cb-${u}`, f = o ? `${p}-helper` : void 0, g = t === "sm" ? s.sizeSm : t === "lg" ? s.sizeLg : s.sizeMd;
  return /* @__PURE__ */ r("div", { className: s.field, children: [
    /* @__PURE__ */ e(
      "input",
      {
        ref: c,
        id: p,
        type: "checkbox",
        disabled: i,
        "aria-describedby": f,
        className: d(s.input, s.checkbox, g, n),
        ...h
      }
    ),
    l ? /* @__PURE__ */ e("label", { htmlFor: p, className: d("ds-type-label", s.label, i && s.labelDisabled), children: l }) : null,
    o ? /* @__PURE__ */ e("span", { id: f, className: d("ds-type-caption", l ? s.helper : s.helperFull), children: o }) : null
  ] });
});
D.displayName = "Checkbox";
const B = v(function({ label: l, helperText: o, size: t = "md", className: n, disabled: i, id: m, ...h }, c) {
  const u = A(), p = m ?? `radio-${u}`, f = o ? `${p}-helper` : void 0, g = t === "sm" ? s.sizeSm : t === "lg" ? s.sizeLg : s.sizeMd;
  return /* @__PURE__ */ r("div", { className: s.field, children: [
    /* @__PURE__ */ e(
      "input",
      {
        ref: c,
        id: p,
        type: "radio",
        disabled: i,
        "aria-describedby": f,
        className: d(s.input, s.radio, g, n),
        ...h
      }
    ),
    l ? /* @__PURE__ */ e("label", { htmlFor: p, className: d("ds-type-label", s.label, i && s.labelDisabled), children: l }) : null,
    o ? /* @__PURE__ */ e("span", { id: f, className: d("ds-type-caption", l ? s.helper : s.helperFull), children: o }) : null
  ] });
});
B.displayName = "Radio";
const I = v(function({ label: l, helperText: o, size: t = "md", className: n, disabled: i, id: m, ...h }, c) {
  const u = A(), p = m ?? `toggle-${u}`, f = o ? `${p}-helper` : void 0, g = t === "sm" ? s.toggleSm : t === "lg" ? s.toggleLg : s.toggleMd, y = t === "sm" ? s.thumbSm : t === "lg" ? s.thumbLg : s.thumbMd;
  return /* @__PURE__ */ r("div", { className: s.field, children: [
    /* @__PURE__ */ r("label", { htmlFor: p, className: d(s.toggleWrap, i && s.toggleDisabled), children: [
      /* @__PURE__ */ e(
        "input",
        {
          ref: c,
          id: p,
          type: "checkbox",
          disabled: i,
          "aria-describedby": f,
          className: d(s.toggleInput, n),
          ...h
        }
      ),
      /* @__PURE__ */ e("span", { className: d(s.track, g), children: /* @__PURE__ */ e("span", { className: d(s.thumb, y) }) })
    ] }),
    l ? /* @__PURE__ */ e("label", { htmlFor: p, className: d("ds-type-label", s.label, i && s.labelDisabled), children: l }) : null,
    o ? /* @__PURE__ */ e("span", { id: f, className: d("ds-type-caption", l ? s.helper : s.helperFull), children: o }) : null
  ] });
});
I.displayName = "Toggle";
const re = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl", H = "ds-type-label mt-12 mb-6", Y = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 max-w-5xl border border-[var(--color-muted)] border-opacity-40 p-6 md:p-8";
function Xr() {
  const a = A(), [l, o] = R(!1), [t, n] = R("omega"), [i, m] = R(!0);
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("p", { className: `${re} mb-8`, children: [
      "Figma frame (node ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: ce }),
      "):",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: We,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Checkbox, radio & toggle"
        }
      ),
      ". Components below are library CSS-module implementations with tokenized typography and form surface colors."
    ] }),
    /* @__PURE__ */ e("h3", { className: H, children: "Checkbox" }),
    /* @__PURE__ */ r("div", { className: Y, children: [
      /* @__PURE__ */ e(D, { id: `${a}-cb-1`, label: "Subscribe" }),
      /* @__PURE__ */ e(
        D,
        {
          id: `${a}-cb-2`,
          label: "Controlled",
          checked: l,
          onChange: (h) => o(h.target.checked)
        }
      ),
      /* @__PURE__ */ e(D, { id: `${a}-cb-3`, label: "Disabled", disabled: !0 }),
      /* @__PURE__ */ e(D, { id: `${a}-cb-4`, label: "Small", size: "sm", defaultChecked: !0 }),
      /* @__PURE__ */ e(D, { id: `${a}-cb-5`, label: "Medium", size: "md" }),
      /* @__PURE__ */ e(D, { id: `${a}-cb-6`, label: "Large", size: "lg", helperText: "Optional helper under the control." })
    ] }),
    /* @__PURE__ */ e("h3", { className: H, children: "Radio" }),
    /* @__PURE__ */ r("p", { className: `${re} mb-6`, children: [
      "Share a single ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "name" }),
      " so only one option stays selected; wrap in ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "fieldset" }),
      " / ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "legend" }),
      " for accessibility."
    ] }),
    /* @__PURE__ */ r("fieldset", { className: `${Y} border-[var(--color-muted)] border-opacity-40`, children: [
      /* @__PURE__ */ e("legend", { className: "sr-only", children: "Subscription plan" }),
      /* @__PURE__ */ e(
        B,
        {
          id: `${a}-r-1`,
          name: `${a}-plan`,
          label: "Alpha",
          value: "alpha",
          checked: t === "alpha",
          onChange: () => n("alpha")
        }
      ),
      /* @__PURE__ */ e(
        B,
        {
          id: `${a}-r-2`,
          name: `${a}-plan`,
          label: "Omega",
          value: "omega",
          checked: t === "omega",
          onChange: () => n("omega")
        }
      ),
      /* @__PURE__ */ e(
        B,
        {
          id: `${a}-r-3`,
          name: `${a}-plan`,
          label: "Starter",
          value: "starter",
          checked: t === "starter",
          onChange: () => n("starter")
        }
      ),
      /* @__PURE__ */ e(
        B,
        {
          id: `${a}-r-4`,
          name: `${a}-plan`,
          label: "Disabled option",
          value: "disabled",
          disabled: !0
        }
      ),
      /* @__PURE__ */ e(
        B,
        {
          id: `${a}-r-5`,
          name: `${a}-plan-alt`,
          label: "Small",
          size: "sm",
          value: "sm",
          defaultChecked: !0
        }
      ),
      /* @__PURE__ */ e(
        B,
        {
          id: `${a}-r-6`,
          name: `${a}-plan-alt`,
          label: "Large + helper",
          size: "lg",
          value: "lg",
          helperText: "Helper for this row."
        }
      )
    ] }),
    /* @__PURE__ */ e("h3", { className: H, children: "Toggle" }),
    /* @__PURE__ */ r("div", { className: Y, children: [
      /* @__PURE__ */ e(
        I,
        {
          id: `${a}-t-1`,
          label: "Notifications",
          checked: i,
          onChange: (h) => m(h.target.checked)
        }
      ),
      /* @__PURE__ */ e(I, { id: `${a}-t-2`, label: "Off by default", defaultChecked: !1 }),
      /* @__PURE__ */ e(I, { id: `${a}-t-3`, label: "Disabled on", disabled: !0, defaultChecked: !0 }),
      /* @__PURE__ */ e(I, { id: `${a}-t-4`, label: "Small", size: "sm" }),
      /* @__PURE__ */ e(I, { id: `${a}-t-5`, label: "Medium", size: "md", defaultChecked: !0 }),
      /* @__PURE__ */ e(I, { id: `${a}-t-6`, label: "Large", size: "lg", helperText: "Optional helper text." })
    ] })
  ] });
}
const M = v(
  ({
    variant: a = "default",
    title: l,
    message: o,
    dismissible: t = !1,
    onDismiss: n,
    className: i = "",
    children: m,
    ...h
  }, c) => {
    const u = a === "error" ? "var(--color-error)" : "var(--color-primary)";
    return /* @__PURE__ */ r(
      "div",
      {
        ref: c,
        className: `
          bg-[var(--color-background-elevated)]
          border-t border-r border-b border-[var(--color-foreground)]
          border-l-0
          p-4
          font-[var(--font-family-mono)]
          flex items-start gap-3
          relative
          ${i}
        `,
        style: {
          borderLeftWidth: "4px",
          borderLeftColor: u
        },
        role: "alert",
        ...h,
        children: [
          /* @__PURE__ */ r("div", { className: "flex-1", children: [
            l && /* @__PURE__ */ e(
              "div",
              {
                className: `ds-type-toast-title ${a === "error" ? "ds-type-toast-title--error" : ""}`,
                children: l
              }
            ),
            o && /* @__PURE__ */ e("div", { className: "ds-type-toast-body", children: o }),
            m
          ] }),
          t && /* @__PURE__ */ e(
            "button",
            {
              type: "button",
              onClick: n,
              className: "ds-type-toast-dismiss flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer p-0",
              "aria-label": "Dismiss",
              children: "×"
            }
          )
        ]
      }
    );
  }
);
M.displayName = "Toast";
const dr = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl", mr = "flex flex-col gap-6 max-w-xl";
function Jr() {
  const [a, l] = R(!1);
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("p", { className: `${dr} mb-8`, children: [
      "Figma (node ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: he }),
      "):",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Ge,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Toast"
        }
      ),
      ". Presentation-only; stack timing, portals, and a11y live region wiring in your app host (see website",
      " ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "toaster" }),
      ")."
    ] }),
    /* @__PURE__ */ r("div", { className: mr, children: [
      /* @__PURE__ */ e(
        M,
        {
          variant: "default",
          title: "This is a toast",
          message: "This is an additional message that could be necessary."
        }
      ),
      /* @__PURE__ */ e(
        M,
        {
          variant: "error",
          title: "This is a toast",
          message: "This is an additional message that could be necessary."
        }
      ),
      a ? /* @__PURE__ */ e(
        "button",
        {
          type: "button",
          className: "font-[var(--font-family-mono)] text-sm text-[var(--color-primary)] uppercase tracking-wider border border-[var(--color-muted)] px-4 py-2 bg-transparent cursor-pointer hover:opacity-90",
          onClick: () => l(!1),
          children: "Show dismissible toast again"
        }
      ) : /* @__PURE__ */ e(
        M,
        {
          variant: "default",
          title: "Dismissible",
          message: "Close button calls onDismiss — host owns removal from the DOM.",
          dismissible: !0,
          onDismiss: () => l(!0)
        }
      ),
      /* @__PURE__ */ e(M, { variant: "default", title: "Title only" }),
      /* @__PURE__ */ e(M, { variant: "default", message: "Message only, no title." })
    ] })
  ] });
}
const W = "text-[var(--color-muted)] text-xs font-[var(--font-family-mono)] mb-2 uppercase tracking-wider";
function Kr() {
  return /* @__PURE__ */ r("div", { className: "space-y-10 max-w-3xl font-[var(--font-family-mono)]", children: [
    /* @__PURE__ */ r("p", { className: "text-[var(--color-muted)] text-sm leading-relaxed", children: [
      "Figma (node ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: se }),
      "):",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Me,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Typography"
        }
      ),
      ". Roles below map to CSS variables and ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: ".ds-type-*" }),
      " ",
      "utilities in ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "tokens/typography.css" }),
      "."
    ] }),
    /* @__PURE__ */ r("div", { children: [
      /* @__PURE__ */ e("p", { className: W, children: "Section title (library H2 pattern)" }),
      /* @__PURE__ */ e("p", { className: "text-[var(--color-foreground)] text-2xl font-bold uppercase tracking-wider border-b border-[var(--color-muted)] pb-4", children: "Sample section" })
    ] }),
    /* @__PURE__ */ r("div", { children: [
      /* @__PURE__ */ e("p", { className: W, children: "Label — form / selection" }),
      /* @__PURE__ */ e("p", { className: "ds-type-label", children: "Field label" }),
      /* @__PURE__ */ r("p", { className: "text-[var(--color-muted)] text-xs mt-2", children: [
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: ".ds-type-label" }),
        " ·",
        " ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "var(--font-size-sm)" }),
        ",",
        " ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "var(--font-weight-bold)" }),
        ", uppercase,",
        " ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "var(--letter-spacing-label)" })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { children: [
      /* @__PURE__ */ e("p", { className: W, children: "Caption — helper / secondary" }),
      /* @__PURE__ */ e("p", { className: "ds-type-caption", children: "Supporting line or helper text for a control." }),
      /* @__PURE__ */ e("p", { className: "ds-type-caption-error mt-2", children: "Error caption uses the error token." })
    ] }),
    /* @__PURE__ */ r("div", { children: [
      /* @__PURE__ */ e("p", { className: W, children: "Toast title & body" }),
      /* @__PURE__ */ r("div", { className: "border border-[var(--color-muted)] border-opacity-40 p-4 space-y-3 bg-[var(--color-background)]", children: [
        /* @__PURE__ */ e("p", { className: "ds-type-toast-title", children: "Toast title" }),
        /* @__PURE__ */ e("p", { className: "ds-type-toast-body", children: "Toast body — smaller, muted, for secondary detail." }),
        /* @__PURE__ */ e("p", { className: "ds-type-toast-title ds-type-toast-title--error", children: "Error toast title" })
      ] })
    ] }),
    /* @__PURE__ */ r("div", { children: [
      /* @__PURE__ */ e("p", { className: W, children: "Body (mono, default page copy)" }),
      /* @__PURE__ */ r("p", { className: "text-[var(--color-foreground)] text-base leading-[var(--line-height-normal)]", children: [
        "Body text uses the document ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "font-family-mono" }),
        " on",
        " ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: ":root" }),
        " with",
        " ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "var(--font-size-base)" }),
        " where needed."
      ] })
    ] })
  ] });
}
const hr = "_root_1ecj9_4", ur = "_mediaWrap_1ecj9_25", pr = "_mediaImg_1ecj9_33", gr = "_badge_1ecj9_41", fr = "_body_1ecj9_56", _r = "_title_1ecj9_63", br = "_subheader_1ecj9_74", yr = "_price_1ecj9_84", vr = "_attributes_1ecj9_91", Nr = "_cta_1ecj9_119", x = {
  root: hr,
  mediaWrap: ur,
  mediaImg: pr,
  badge: gr,
  body: fr,
  title: _r,
  subheader: br,
  price: yr,
  attributes: vr,
  cta: Nr
}, xr = v(function({
  title: l,
  subheader: o,
  price: t,
  attributes: n,
  media: i,
  badge: m,
  highlighted: h = !1,
  theme: c = "secondary",
  cta: u,
  footer: p,
  className: f,
  ...g
}, y) {
  return /* @__PURE__ */ r(
    "div",
    {
      ref: y,
      className: d(x.root, f),
      "data-theme": c,
      ...h ? { "data-highlighted": "true" } : {},
      ...g,
      children: [
        /* @__PURE__ */ r("div", { className: x.mediaWrap, children: [
          i ? /* @__PURE__ */ e("img", { className: x.mediaImg, src: i.src, alt: i.alt, loading: "lazy" }) : null,
          m ? /* @__PURE__ */ e("span", { className: x.badge, children: m }) : null
        ] }),
        /* @__PURE__ */ r("div", { className: x.body, children: [
          /* @__PURE__ */ e("h3", { className: x.title, children: l }),
          o ? /* @__PURE__ */ e("p", { className: x.subheader, children: o }) : null,
          t ? /* @__PURE__ */ e("div", { className: x.price, children: t }) : null,
          n && n.length > 0 ? /* @__PURE__ */ e("ul", { className: x.attributes, children: n.map((z) => /* @__PURE__ */ e("li", { children: z }, z)) }) : null,
          p,
          /* @__PURE__ */ e("div", { className: x.cta, children: /* @__PURE__ */ e(_, { variant: "primary", size: "medium", href: u.href, external: u.external, children: u.label }) })
        ] })
      ]
    }
  );
});
xr.displayName = "ProductCard";
const wr = "_root_nvnot_5", Cr = "_rootFull_nvnot_14", Sr = "_input_nvnot_19", $r = "_inputError_nvnot_53", kr = "_sizeSm_nvnot_62", zr = "_sizeMd_nvnot_67", Lr = "_sizeLg_nvnot_72", F = {
  root: wr,
  rootFull: Cr,
  input: Sr,
  inputError: $r,
  sizeSm: kr,
  sizeMd: zr,
  sizeLg: Lr
}, $ = v(function({
  label: l,
  helperText: o,
  error: t,
  size: n = "md",
  fullWidth: i = !1,
  className: m,
  id: h,
  disabled: c,
  ...u
}, p) {
  const f = A(), g = h ?? `tf-${f}`, y = `${g}-description`, z = !!(t ?? o), E = n === "sm" ? F.sizeSm : n === "lg" ? F.sizeLg : F.sizeMd;
  return /* @__PURE__ */ r("div", { className: d(F.root, i && F.rootFull), children: [
    l ? /* @__PURE__ */ e("label", { className: "ds-type-label", htmlFor: g, children: l }) : null,
    /* @__PURE__ */ e(
      "input",
      {
        ref: p,
        id: g,
        disabled: c,
        "aria-invalid": t ? "true" : void 0,
        "aria-describedby": z ? y : void 0,
        className: d(F.input, E, t && F.inputError, m),
        ...u
      }
    ),
    z ? /* @__PURE__ */ e(
      "span",
      {
        id: y,
        className: t ? "ds-type-caption-error" : "ds-type-caption",
        role: t ? "alert" : void 0,
        children: t ?? o
      }
    ) : null
  ] });
});
$.displayName = "TextField";
const te = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl", Tr = "text-[var(--color-foreground)] font-[var(--font-family-mono)] uppercase tracking-wider text-sm mt-12 mb-4", Fr = "list-disc pl-5 space-y-2 text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl";
function Qr() {
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("p", { className: `${te} mb-8`, children: [
      "Component spec in Figma (node ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: me }),
      "):",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Ee,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Text field"
        }
      ),
      "."
    ] }),
    /* @__PURE__ */ r("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 max-w-4xl", children: [
      /* @__PURE__ */ e($, { id: "lib-tf-default", label: "Default", placeholder: "Enter text…" }),
      /* @__PURE__ */ e(
        $,
        {
          id: "lib-tf-helper",
          label: "With helper",
          type: "email",
          placeholder: "you@example.com",
          helperText: "We will only use this for account recovery."
        }
      ),
      /* @__PURE__ */ e($, { id: "lib-tf-error", label: "With error", placeholder: "Required", error: "This field is required." }),
      /* @__PURE__ */ e($, { id: "lib-tf-disabled", label: "Disabled", placeholder: "Cannot edit", disabled: !0 }),
      /* @__PURE__ */ e($, { id: "lib-tf-sm", label: "Small", size: "sm", placeholder: "Small" }),
      /* @__PURE__ */ e($, { id: "lib-tf-md", label: "Medium", size: "md", placeholder: "Medium (default)" }),
      /* @__PURE__ */ e($, { id: "lib-tf-lg", label: "Large", size: "lg", placeholder: "Large" }),
      /* @__PURE__ */ e("div", { className: "md:col-span-2", children: /* @__PURE__ */ e(
        $,
        {
          id: "lib-tf-full",
          label: "Full width",
          placeholder: "Spans the content column",
          fullWidth: !0,
          helperText: "Set fullWidth when the field should stretch in a form layout."
        }
      ) })
    ] }),
    /* @__PURE__ */ e("h3", { id: "library-text-field-usage", className: Tr, children: "How to use" }),
    /* @__PURE__ */ r("p", { className: `${te} mb-4`, children: [
      "Usage / anatomy in Figma (node",
      " ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: ue }),
      "):",
      " ",
      /* @__PURE__ */ e(
        "a",
        {
          href: Oe,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-[var(--color-primary)] hover:underline",
          children: "Web — Brand Design System · Text field — how to use"
        }
      ),
      "."
    ] }),
    /* @__PURE__ */ r("ul", { className: Fr, children: [
      /* @__PURE__ */ r("li", { children: [
        "Always associate a visible ",
        /* @__PURE__ */ e("strong", { className: "text-[var(--color-foreground)]", children: "label" }),
        " with the control via ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "htmlFor" }),
        " / ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "id" }),
        " ",
        "(this component generates an ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "id" }),
        " when you omit one)."
      ] }),
      /* @__PURE__ */ r("li", { children: [
        "Use ",
        /* @__PURE__ */ e("strong", { className: "text-[var(--color-foreground)]", children: "helperText" }),
        " for format hints or expectations; use ",
        /* @__PURE__ */ e("strong", { className: "text-[var(--color-foreground)]", children: "error" }),
        " for validation messages (replaces helper when both are not needed — pass only one at a time)."
      ] }),
      /* @__PURE__ */ r("li", { children: [
        "Do not rely on ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "placeholder" }),
        " alone for a label; screen readers and Figma both expect an explicit label."
      ] }),
      /* @__PURE__ */ r("li", { children: [
        "Wire ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "required" }),
        ",",
        " ",
        /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "autoComplete" }),
        ", and server-side validation in the host app; this component stays presentational."
      ] })
    ] })
  ] });
}
const Dr = "_root_zl4t2_1", Br = "_sizeSmall_zl4t2_11", Ir = "_sizeMedium_zl4t2_18", Mr = "_sizeLarge_zl4t2_25", Wr = "_variantPrimary_zl4t2_32", jr = "_variantSecondary_zl4t2_37", Rr = "_variantTertiary_zl4t2_42", Ar = "_weightRegular_zl4t2_48", Er = "_weightBold_zl4t2_52", S = {
  root: Dr,
  sizeSmall: Br,
  sizeMedium: Ir,
  sizeLarge: Mr,
  variantPrimary: Wr,
  variantSecondary: jr,
  variantTertiary: Rr,
  weightRegular: Ar,
  weightBold: Er
}, w = v(function({ text: l, variant: o = "primary", size: t = "medium", weight: n = "bold", className: i, children: m, ...h }, c) {
  const u = t === "small" ? S.sizeSmall : t === "large" ? S.sizeLarge : S.sizeMedium, p = o === "secondary" ? S.variantSecondary : o === "tertiary" ? S.variantTertiary : S.variantPrimary;
  return /* @__PURE__ */ e(
    "div",
    {
      ref: c,
      className: d(
        S.root,
        u,
        p,
        n === "regular" ? S.weightRegular : S.weightBold,
        i
      ),
      ...h,
      children: m ?? l
    }
  );
});
w.displayName = "Tag";
const Gr = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] max-w-3xl mb-8", Or = "flex flex-col gap-6 max-w-5xl border border-[var(--color-muted)] border-opacity-40 p-6 md:p-8", V = "text-[var(--color-muted)] text-sm font-[var(--font-family-mono)] uppercase tracking-wider mb-4";
function Zr() {
  return /* @__PURE__ */ r("div", { children: [
    /* @__PURE__ */ r("p", { className: Gr, children: [
      "Library Tag mirrors website ",
      /* @__PURE__ */ e("code", { className: "text-[var(--color-foreground)]", children: "TagPill" }),
      " variants and sizing while keeping a simple, presentational API."
    ] }),
    /* @__PURE__ */ r("div", { className: Or, children: [
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h3", { className: V, children: "Primary (martian red)" }),
        /* @__PURE__ */ r("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ e(w, { variant: "primary", size: "small", children: "Limited supply" }),
          /* @__PURE__ */ e(w, { variant: "primary", size: "medium", children: "Limited supply" }),
          /* @__PURE__ */ e(w, { variant: "primary", size: "large", children: "Limited supply" })
        ] })
      ] }),
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h3", { className: V, children: "Secondary (neutral)" }),
        /* @__PURE__ */ r("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ e(w, { variant: "secondary", size: "small", children: "Limited supply" }),
          /* @__PURE__ */ e(w, { variant: "secondary", size: "medium", children: "Limited supply" }),
          /* @__PURE__ */ e(w, { variant: "secondary", size: "large", children: "Limited supply" })
        ] })
      ] }),
      /* @__PURE__ */ r("div", { children: [
        /* @__PURE__ */ e("h3", { className: V, children: "Tertiary (glass)" }),
        /* @__PURE__ */ r("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ e(w, { variant: "tertiary", size: "small", children: "Limited supply" }),
          /* @__PURE__ */ e(w, { variant: "tertiary", size: "medium", children: "Limited supply" }),
          /* @__PURE__ */ e(w, { variant: "tertiary", size: "large", children: "Limited supply" })
        ] })
      ] })
    ] })
  ] });
}
export {
  pe as BasicCard,
  _ as Button,
  j as ButtonGroup,
  Yr as ButtonGroupShowcase,
  Hr as ButtonShowcase,
  ca as CardBrackets,
  ge as CardFilterBar,
  Vr as CardFilterBarShowcase,
  D as Checkbox,
  _a as MainCard,
  xr as ProductCard,
  B as Radio,
  Xr as SelectionControlsShowcase,
  w as Tag,
  Zr as TagShowcase,
  $ as TextField,
  Qr as TextFieldShowcase,
  M as Toast,
  Jr as ToastShowcase,
  I as Toggle,
  Kr as TypographyShowcase,
  ne as WebsiteButton
};
