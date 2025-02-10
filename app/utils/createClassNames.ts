// classNamesSimple.js

/**
 * 複数の文字列を受け取り、truthy な値のみをスペース区切りで連結して返す関数
 *
 * @param  {...string} classes - クラス名（truthy な文字列のみ有効）
 * @returns {string} 連結されたクラス名
 */
export const createClassNames = (...classes: string[]): string => classes.filter(Boolean).join(' ');