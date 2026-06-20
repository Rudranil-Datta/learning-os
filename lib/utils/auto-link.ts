export const AUTO_LINK_MIN_TITLE_LENGTH = 3;
export const AUTO_LINK_MAX_LINKS_PER_NODE = 20;

export function explanationMentionsTitle(
  explanation: string,
  title: string,
): boolean {
  const normalizedTitle = title.trim();

  if (normalizedTitle.length < AUTO_LINK_MIN_TITLE_LENGTH) {
    return false;
  }

  return explanation.toLowerCase().includes(normalizedTitle.toLowerCase());
}
