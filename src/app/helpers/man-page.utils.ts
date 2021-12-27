function getManPageUrl(term: string): string {
  // Matches (8) in idmap_nss(8)
  const section = /\(([0-9])\)$/.exec(term);
  let routeParam = section ? term.substr(0, term.length - 3) : term;
  routeParam = routeParam.replace('.', '');

  return `http://manpages.org/${routeParam}/${section ? section[1] : ''}`;
}

export function getManPageLink(term: string): string {
  const url = getManPageUrl(term);
  return `<a href="${url}" target="_blank">${term}</a>`;
}
