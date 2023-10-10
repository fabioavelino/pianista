import death_note_light_theme from "./death_note_light_theme";
import naruto_sadness_sorrow from "./naruto_sadness_sorrow";
import ff7_battle_theme from "./ff7_battle_theme";

const sheets = [naruto_sadness_sorrow, ff7_battle_theme, death_note_light_theme]

const getSheetById = (id) => {
  return sheets.find((el) => el.id === parseInt(id));
}

export default sheets
export { getSheetById }