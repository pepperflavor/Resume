import { ADVENTURER_LOG_URL } from '@/game/config/guildRecords';

export const DIALOGUES = {
  // --- way-marks ---------------------------------------------------------
  // One per walk-in exit. They only answer "where does this way go"; the map
  // the player is standing in is left to the place itself to say.
  signHomeMarket: {
    speaker: '길 안내판',
    role: 'Market',
    greeting:
      '서쪽 길을 따라가면 시장이 나온다.\n상인들이 좌판을 펴고 있는 곳이다.',
    exit: '확인',
  },
  signMarketHome: {
    speaker: '길 안내판',
    role: 'Home',
    greeting: '동쪽 길 끝에는 집이 있다.\n울타리가 보이면 다 온 것이다.',
    exit: '확인',
  },
  signMarketGuild: {
    speaker: '길 안내판',
    role: 'Guild',
    greeting: '서쪽 길은 길드 관리국으로 이어진다.',
    exit: '확인',
  },
  guildNoticeBoard: {
    speaker: '길드 관리국 게시판',
    role: 'Guild',
    greeting: '의뢰는 길드 관리국 접수처를 이용해주세요.\n\n- 기린 -',
    exit: '확인',
  },
  signGuildMarket: {
    speaker: '길 안내판',
    role: 'Market',
    greeting: '동쪽 길은 시장으로 이어진다.',
    exit: '확인',
  },
  signGuildDungeon: {
    speaker: '길 안내판',
    role: 'Dungeon',
    greeting: '서쪽 길은 던전 입구로 이어진다.\n채비 없이 가지는 말 것.',
    exit: '확인',
  },
  signEntranceGuild: {
    speaker: '길 안내판',
    role: 'Guild',
    greeting: '동쪽 길은 길드 관리국으로 이어진다.',
    exit: '확인',
  },
  signEntranceBoss: {
    speaker: '길 안내판',
    role: 'Dungeon',
    greeting: '황금고양이 상을 지키는 드래곤 있음 주의요망.',
    exit: '확인',
  },
  signEntranceGarden: {
    speaker: '길 안내판',
    role: 'Garden',
    greeting: '모험가들이 행운을 빌러가는 연못이 있다고 한다.',
    exit: '확인',
  },
  // The slab by the chamber door. It states what the snoring does and stops
  // there: that silence is the danger is for the player to work out.
  signBossEntrance: {
    speaker: '룬이 새겨진 석판',
    role: 'Dungeon',
    greeting: '드래곤의 코고는 소리는\n발걸음 소리를 지워줄 거예요.',
    exit: '확인',
  },
  signGardenEntrance: {
    speaker: '룬이 새겨진 받침돌',
    role: 'Dungeon',
    greeting: '행운이 깃든 연못.\n가끔 요정이 나타난다.',
    exit: '확인',
  },
  deer: {
    speaker: '사슴 상인',
    role: 'Resume',
    greeting: '어서 와, 여행자.\n이곳에는 한 개발자의 기록을 맡아두고 있어.',
    choice: '기록에 대해 묻는다',
    reply: '기록에는 한 개발자가 걸어온 길이 담겨 있어.',
    link: {
      label: 'Resume 보기',
      href: '/assets/resume/current-portfolio.pdf',
    },
  },
  bear: {
    speaker: '곰 대장장이',
    role: 'Skills',
    greeting: '기술은 장비와 비슷하지.\n잘 다듬어 놓아야 필요할 때 쓸 수 있어.',
    choice: '기술에 대해 묻는다',
    reply: '튼튼한 장비처럼, 기술도 꾸준히 다듬는 게 중요하지.',
  },
  fox: {
    speaker: '여우 안내인',
    role: 'Projects / information',
    greeting: '이 마을 밖에서 만들어진 것들이 궁금한가?',
    choice: '프로젝트에 대해 묻는다',
    reply: '프로젝트마다 풀어야 했던 문제와 선택의 흔적이 남아 있지.',
    link: {
      label: 'Projects 보기',
      href: 'https://periwinkle-amaranthus-fc5.notion.site/884f7688701741fb93e48c0446b72430',
    },
  },
  cat: {
    speaker: '고양이 연금술사',
    role: 'Gossip',
    greeting: '서쪽 끝에는 이상한 던전이 하나 있어.',
    choice: '소문을 듣는다',
    reply:
      '황금빛 고양이상을 봤다는 얘기가 있더군.\n어디에 쓰는 물건인지는 모르겠지만...',
  },
  chicken: { speaker: '닭', role: 'Ambient', greeting: '꼭꼬꼬....' },
  bird: {
    speaker: '새',
    role: 'Market',
    greeting: 'Merge 했나? 짹!',
    exit: '나가기',
  },
  // Home keeps its own lines so the market's ambient birds stay untouched. An
  // explicit `exit` is what gives these panels a 나가기 choice.
  homeSign: {
    speaker: '마당 앞 안내판',
    role: 'Home',
    greeting: '모험을 통해 Resume를 얻어보세요!',
    exit: '나가기',
  },
  homeBird: {
    speaker: '새',
    role: 'Home',
    greeting: '짹째잭...뭔가 잊은게 있는 것 같은데..짹',
    exit: '나가기',
  },
  homeChicken: {
    speaker: '꼬꼬',
    role: 'Home',
    greeting: '꼭꼬곡...',
    exit: '나가기',
  },
  // Kkokko quest. `kkokkoTake` has a choice but no reply, so picking it closes
  // the panel and fires the scene's confirm callback — the same shape the
  // golden cat pickup uses.
  kkokkoTake: {
    speaker: '꼬꼬',
    role: 'Home',
    greeting: '꼭꼬곡...',
    choice: '여우에게 데려다주기',
    exit: '나가기',
  },
  kkokkoHome: {
    speaker: '꼬꼬',
    role: 'Market',
    greeting: '꼭꼬곡! 꼭꼬...',
    exit: '나가기',
  },
  // Two panels, not one: picking 가까이 가본다 closes this one and hands the
  // scene a confirm callback, which walks the player up to the well before
  // `marketWellClose` opens. Same shape as the Kkokko pickup.
  marketWell: {
    speaker: '우물',
    role: 'Market',
    greeting: 'Market 가운데 있는 우물이다.\n안쪽에서 무언가 소리가 들린다.',
    choice: '가까이 가본다',
    exit: '나가기',
  },
  marketWellClose: {
    speaker: '우물',
    role: 'Market',
    greeting:
      '우물에 가까이 가자 안쪽에서 이상한 소리가 들린다.\n\n' +
      "'레거..시....\n클린...\n세이브....\n확...인.....'\n\n" +
      '.......\n\n' +
      '의미를 알 수 없는 소리가 들리자\n당신은 갑자기 등골이 쭈뼛 솟는다.\n\n' +
      '우물에서 빨리 멀어지는 게 좋겠다.',
    exit: '나가기',
  },
  dungeonEntry: {
    speaker: '던전',
    role: 'Dungeon',
    greeting:
      '던전 안에서는 소리가 재생될 예정입니다.\n입장 전에 볼륨을 조절해주세요.',
    choice: '던전에 들어간다',
  },
  bossChamberSealed: {
    speaker: '던전',
    role: 'Dungeon',
    greeting:
      '황금 고양이상을 훔친 걸 들키면\n정말 큰일 날 것 같다.\n\n지금은 다시 들어가지 않는 게 좋겠다.',
    exit: '확인',
  },
  dungeonGuide: {
    speaker: '오래된 안내판',
    role: 'Dungeon',
    greeting:
      '던전 안의 황금 고양이상을\n호수의 요정에게 가져다주면\n좋은 걸 알려줄지도...?',
  },
  goldenCat: {
    speaker: '황금 고양이상',
    role: 'Dungeon',
    greeting:
      '귀엽고 반짝거려!\n누군가 애타게 찾고 있다고\n들었던 것 같은데...',
    choice: '가져간다',
    exit: '그냥 둔다',
  },
  adventurerMerchant: {
    speaker: '모험가 상인',
    role: 'Dungeon',
    greeting:
      '던전의 주인 몰래\n황금 고양이상을 갖고 온다면\n내가 특별한 정보를 알려주지.',
    choice: '황금 고양이상에 대해 묻는다',
    reply:
      '안쪽 방 한가운데에 있다는 소문이 있어.\n문제는 그 주인이 눈을 떼지 않는다는 거지.',
  },
  merchantWithCat: {
    speaker: '모험가 상인',
    role: 'Dungeon',
    greeting: '정말 가져왔군.\n생각보다 대단한 여행자인데?',
    choice: '특별한 정보에 대해 묻는다',
    reply:
      '계단 위 정원의 연못으로 가 봐.\n그 물건을 기다리는 존재가 있을지도 모르지.',
  },
  bossChamberEntry: {
    speaker: '안쪽 문',
    role: 'Dungeon',
    greeting: '안쪽에서 묵직한 숨소리가 들린다.',
    choice: '들어간다',
    exit: '돌아간다',
  },
  adventurerRabbit: {
    speaker: '토끼 모험가',
    role: 'Dungeon',
    greeting:
      '안쪽에 들어갈 거라면 조심해.\n저 녀석은 생각보다 눈치가 빠르더라고.',
  },
  adventurerCat: {
    speaker: '고양이 모험가',
    role: 'Dungeon',
    greeting: '난 장비를 좀 더 손보고 들어갈 생각이야.',
  },
  pondFairyWaiting: {
    speaker: '연못의 요정',
    role: 'Garden',
    greeting: '혹시 황금빛으로 반짝이는 고양이를 본 적 있니?',
    choice: '황금 고양이에 대해 묻는다',
    reply: '오래전 이 연못 곁에 있던 아이야.\n다시 만날 수 있으면 좋겠어.',
  },
  pondFairyFound: {
    speaker: '연못의 요정',
    role: 'Garden',
    greeting: '그 황금빛...!\n정말 그 아이를 찾아온 거야?',
    choice: '어떻게 하면 되는지 묻는다',
    reply: '연못 앞 제단에 올려줘.\n다시 이곳으로 돌아오길 오래 기다렸어.',
  },
  pondFairyOffered: {
    speaker: '연못의 요정',
    role: 'Garden',
    greeting: '다시 이 연못으로 돌아와 줬구나.',
    choice: '특별한 정보를 듣는다',
    reply:
      '약속한 대로 특별한 정보를 알려줄게.\n이 세계를 만든 사람의 기록이\n저 너머에 남아 있어.',
    link: {
      label: 'GitHub 보기',
      href: 'https://github.com/pepperflavor',
    },
  },
  offeringAltar: {
    speaker: '연못의 제단',
    role: 'Garden',
    greeting: '무언가를 올려놓을 수 있을 것 같다.',
  },
  offeringAltarWithCat: {
    speaker: '연못의 제단',
    role: 'Garden',
    greeting: '황금 고양이상을 이곳에 올려둘까?',
    choice: '황금 고양이상 바치기',
    exit: '나가기',
  },
  offeringAltarDone: {
    speaker: '연못의 제단',
    role: 'Garden',
    greeting: '황금 고양이상이 제단 위에서 조용히 빛나고 있다.',
  },
  // --- Guild Bureau ------------------------------------------------------
  // The stairways at either end of the hall. One line, one way out: the floor
  // above is a placeholder until there is a second floor to walk into.
  guildFloorLocked: {
    speaker: '길드 관리국',
    role: 'Guild',
    greeting: '아직 2층은 열리지 않았다.',
    exit: '나가기',
  },
  // The receptionist and the company desks open the guild panel instead: they
  // need three or four branches, which a dialogue's single `choice` cannot hold.
  guildArchivist: {
    speaker: '기록관',
    role: 'Guild',
    greeting: '음?\n무슨 용무야?\n\n난 보시다시피 아주 바쁘다고.',
    choice: '📖 모험가의 기록장 열람을 요청한다',
    reply:
      '모험가의 기록장을 보고 싶다고?\n\n내가 바빠서 데려다 줄 수는 없고,\n여기로 가봐.\n\n주소가 적힌 쪽지를 받았다.',
    link: { label: '기록을 보러가기', href: ADVENTURER_LOG_URL },
    exit: '나가기',
  },
} as const;
export type DialogueId = keyof typeof DIALOGUES;
