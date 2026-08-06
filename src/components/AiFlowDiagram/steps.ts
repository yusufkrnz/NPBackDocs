export const PARTICIPANTS = ['Kullanıcı', 'Chat UI', 'Backend', 'Registry', 'DB', 'LLM'] as const;

export type Step = {
  from: number;
  to: number;
  label: string;
  description: string;
};

export const STEPS: Step[] = [
  {
    from: 0,
    to: 1,
    label: 'mesaj yazar',
    description: 'Kullanıcı chat arayüzüne doğal dille bir istek yazar.',
  },
  {
    from: 1,
    to: 2,
    label: 'mesajı ilet',
    description: 'Chat UI, mesajı backend’e event-driven kanal üzerinden iletir.',
  },
  {
    from: 2,
    to: 5,
    label: 'mesaj + katalog (isim + şema)',
    description:
      'Backend, LLM’e sadece tool/component isim ve şemalarını gönderir — endpoint, DB, secret asla gitmez.',
  },
  {
    from: 5,
    to: 2,
    label: 'tool_use: get_customer_orders(customer_id)',
    description: 'LLM, hangi veriye ihtiyacı olduğuna karar verip yapılandırılmış bir tool çağrısı döner.',
  },
  {
    from: 2,
    to: 3,
    label: 'whitelist kontrolü',
    description: '"get_customer_orders" gerçekten tanımlı bir tool mu diye Registry’de aranır.',
  },
  {
    from: 3,
    to: 4,
    label: 'gerçek sorgu',
    description: 'Whitelist onayı sonrası gerçek fonksiyon çalışır, yetki kontrolü burada yapılır.',
  },
  {
    from: 4,
    to: 2,
    label: 'gerçek veri',
    description: 'DB’den dönen gerçek sonuç backend’e ulaşır.',
  },
  {
    from: 2,
    to: 5,
    label: 'tool_result: 3 satır, kolonlar: Sipariş No/Tarih/Tutar',
    description:
      'Backend, LLM’e gerçek değerleri değil sadece sonucun ŞEKLİNİ döner — kaç satır var, kolon adları ve tipleri ne. Tek bir gerçek rakam veya isim LLM’e gitmez.',
  },
  {
    from: 5,
    to: 2,
    label: 'tool_use: render_ui(component="DataTable", columns=[...])',
    description:
      'LLM, gördüğü şekle uygun bir component ve kolon listesi seçer — satır değerleri bu kararın hiçbir yerinde yoktur, LLM onları hiç görmedi.',
  },
  {
    from: 2,
    to: 3,
    label: 'component + kolon listesi doğrulama',
    description: 'Component ismi whitelist’te mi, kolon listesi component’in şemasına uyuyor mu kontrol edilir.',
  },
  {
    from: 2,
    to: 1,
    label: 'JSON event {component, GERÇEK rows}',
    description:
      'Backend, LLM’in seçtiği component+kolon bilgisine, adım 6’da zaten elinde olan gerçek satır verisini burada ekler — LLM bu veriyi hiç görmeden JSON client’a gider.',
  },
  {
    from: 1,
    to: 1,
    label: 'render',
    description: 'Chat UI, component registry’den ismi bulur ve gerçek React component’i props’la render eder.',
  },
];
