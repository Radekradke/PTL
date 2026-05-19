
# Ajustes de branding PTL

## Login.tsx — bloco esquerdo
Substitua o bloco do "L" + "Lifting" por:

```tsx
<img
  src="/logo-lifting-horizontal.png"
  alt="Lifting Electric & Instrumentation"
  className="h-20 w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
/>

<p className="mt-5 max-w-sm text-sm leading-6 text-emerald-50/80">
  Painel Técnico Lifting para acompanhamento, resposta e gestão de chamados internos.
</p>
```

## Sidebar.tsx — card da marca
Substitua o header do card da sidebar por:

```tsx
<div className="flex flex-col gap-3">
  <img
    src="/logo-lifting-horizontal.png"
    alt="Lifting Electric & Instrumentation"
    className="h-14 w-fit object-contain"
  />

  <p className="text-[11px] font-black uppercase tracking-[0.20em] text-[#00A859]">
    PTL • SUPPORT PANEL
  </p>
</div>
```

## Header.tsx — texto institucional

```tsx
<p className="text-xs font-black uppercase tracking-[0.18em] text-[#00A859]">
  PTL • Lifting Electric
</p>
<h2 className="truncate text-base sm:text-lg lg:text-xl font-black tracking-[-0.035em] text-[#111827]">
  Painel Técnico Interno
</h2>
```

## index.html

```html
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#00A859" />
```
