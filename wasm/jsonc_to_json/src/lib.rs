use wasm_bindgen::prelude::*;

mod strip_comments;
mod remove_trailing_commas;
mod remove_blank_lines;

pub use remove_blank_lines::remove_blank_lines_native;
pub use remove_trailing_commas::remove_trailing_commas_native;
pub use strip_comments::strip_comments_native;

/// Converts JSONC to JSON by stripping comments, trimming trailing commas, and
/// removing blank lines. This function is shared by both the WASM bindings and
/// the native CLI.
pub fn jsonc_to_json_native(input: &str) -> String {
    let without_comments = strip_comments_native(input);
    let without_commas = remove_trailing_commas_native(&without_comments);
    remove_blank_lines_native(&without_commas)
}

#[wasm_bindgen]
pub fn jsonc_to_json(input: &str) -> String {
    jsonc_to_json_native(input)
}

#[wasm_bindgen]
pub fn strip_comments(input: &str) -> String {
    strip_comments_native(input)
}

#[wasm_bindgen]
pub fn remove_trailing_commas(input: &str) -> String {
    remove_trailing_commas_native(input)
}

#[wasm_bindgen]
pub fn remove_blank_lines(input: &str) -> String {
    remove_blank_lines_native(input)
}

#[cfg(test)]
mod jsonc_to_json_tests;
#[cfg(test)]
mod strip_comments_tests;
#[cfg(test)]
mod remove_trailing_commas_tests;
#[cfg(test)]
mod remove_blank_lines_tests;
