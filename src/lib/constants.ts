/** 無料会員の 1 日の回答上限。DB 側の実体は docs/migration_v2.sql の
 *  free_daily_limit() であり、変更時は両方を合わせること(表示にのみ使用)。 */
export const FREE_DAILY_LIMIT = 10;

/** 出題数の選択肢。0 は「全問」 */
export const QUESTION_COUNT_OPTIONS = [10, 20, 50, 0] as const;
