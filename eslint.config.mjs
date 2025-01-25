import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // セミコロンを強制、fixコマンドで強制変換可能。
      semi: ['error', 'always'],

      // シングルクオーテーションを強制、fixコマンドで強制変換可能。
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],

      // 混合演算子に対して括弧を強制、強制変換不可。
      'no-mixed-operators': [
        'error',
        {
          'groups': [
            ['+', '-', '*', '/', '%', '**'],
            ['&', '|', '^', '~', '<<', '>>', '>>>'],
            ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
            ['&&', '||'],
          ],
          'allowSamePrecedence': false, // 演算子の同じ優先順位を許可するかどうか。
        }
      ],

      // TypeScriptのメンバーデリミタをカンマに限定
      '@typescript-eslint/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'comma',  // 複数行のメンバーデリミタをカンマに設定
          requireLast: false
        },
      }],

      // 型定義に<>を必ず使用するためのルール設定例
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'angle-bracket',
          objectLiteralTypeAssertions: 'never'
        }
      ]
    }
  }
];

export default eslintConfig;
