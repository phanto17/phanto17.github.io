// Shiki theme in the Prism palette, used for code excerpts in project write-ups.
// Background matches --surface so code blocks sit on the same card colour as the rest of the site.
/** @type {import('shiki').ThemeRegistration} */
export default {
  name: 'prism-dark',
  type: 'dark',
  colors: {
    'editor.background': '#2f291b',
    'editor.foreground': '#f3e6d3',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#a79a88', fontStyle: 'italic' } },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.new'],
      settings: { foreground: '#f27c52' },
    },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: '#9fd3a8' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: '#cab5ce' } },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class', 'storage.type.cs'],
      settings: { foreground: '#f6d370' },
    },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: '#f2b180' } },
    { scope: ['variable.parameter'], settings: { foreground: '#faa193' } },
    { scope: ['variable', 'variable.other', 'entity.name.variable'], settings: { foreground: '#f3e6d3' } },
    { scope: ['keyword.operator', 'punctuation', 'meta.brace'], settings: { foreground: '#b9a68f' } },
  ],
};
