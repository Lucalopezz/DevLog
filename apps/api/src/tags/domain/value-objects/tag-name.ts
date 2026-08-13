export class TagName {
  static normalize(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // remove caracteres especiais
      .replace(/\s+/g, '-') // espaços -> hífen
      .replace(/-+/g, '-'); // evita hífens duplicados
  }
}
