export interface CreditPerson {
  label: string;
  name: string;
  link?: string;
}

export interface CreditChannel {
  label: string;
  name: string;
  link?: string;
}

export const BETA_BOT_HUB = "https://t.me/betabot_hub";

export const shivCredits = {
  developer: {
    label: "Developer",
    name: "Beta Bot Hub",
    link: BETA_BOT_HUB,
  } as CreditPerson,

  assistantDeveloper: {
    label: "Assistant Developer",
    name: "THE SHIV",
    link: BETA_BOT_HUB,
  } as CreditPerson,

  updatesChannels: [
    {
      label: "Updates Channel",
      name: "Beta Bot Hub",
      link: BETA_BOT_HUB,
    },
  ] as CreditChannel[],

  supportGroups: [
    {
      label: "Support",
      name: "Beta Bot Hub",
      link: BETA_BOT_HUB,
    },
  ] as CreditChannel[],
};
