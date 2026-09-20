/** The fox's stock. Prices are set dressing — nothing here is purchasable. */
export interface ProjectItem {
  id: string;
  name: string;
  /** Which produce sprite stands in for it on the stall. */
  produce: 'apple' | 'potato' | 'carrot' | 'special';
  /** A real price for stock, a label for the quest reward. */
  price: string;
  stack: readonly string[];
  href: string;
  special?: boolean;
}

export const PROJECT_ITEMS: readonly ProjectItem[] = [
  {
    id: 'check-eat',
    name: 'Check Eat',
    produce: 'apple',
    price: '$ 9',
    stack: ['TypeScript', 'NestJS', 'PostgreSQL', '공공 API', 'Azure OCR'],
    href: 'https://periwinkle-amaranthus-fc5.notion.site/Node-js-JavaScript-TypeScript-Developer-884f7688701741fb93e48c0446b72430?p=26cca838b75f80b8a82ff9c9605ea672&pm=c',
  },
  {
    id: 'stadiumly',
    name: 'Stadiumly',
    produce: 'potato',
    price: '$ 1',
    stack: ['NestJS', 'Redis', 'PostgreSQL'],
    href: 'https://periwinkle-amaranthus-fc5.notion.site/Node-js-JavaScript-TypeScript-Developer-884f7688701741fb93e48c0446b72430?p=210ca838b75f80b9876fe643c499e62d&pm=c',
  },
  {
    id: 'spotking',
    name: 'Spotking',
    produce: 'carrot',
    price: '$ 7',
    stack: ['Swift', 'UIKit', '공공 API'],
    href: 'https://periwinkle-amaranthus-fc5.notion.site/Node-js-JavaScript-TypeScript-Developer-884f7688701741fb93e48c0446b72430?p=1cfca838b75f801db015da71219f530d&pm=c',
  },
];

const SPECIAL_REWARD_HREF =
  'https://periwinkle-amaranthus-fc5.notion.site/Node-js-JavaScript-TypeScript-Developer-884f7688701741fb93e48c0446b72430';

/**
 * The fox's thank-you. It is a normal stall card rather than a separate link
 * choice, and only joins the list once the Kkokko quest is COMPLETED.
 */
export const SPECIAL_SET: ProjectItem = {
  id: 'special-set',
  name: '여우의 특별 세트',
  produce: 'special',
  price: 'QUEST REWARD',
  stack: ['꼬꼬를 찾아준 답례로 골라 담은 한 상자'],
  href: SPECIAL_REWARD_HREF,
  special: true,
};
