use std::env;
use std::io::{self, Read};

use jsonc_to_json::jsonc_to_json_native;

fn main() {
    let mut args = env::args().skip(1);
    if let Some(inline_input) = args.next() {
        println!("{}", jsonc_to_json_native(&inline_input));
        return;
    }

    let mut buffer = String::new();
    io::stdin()
        .read_to_string(&mut buffer)
        .expect("failed to read from stdin");
    print!("{}", jsonc_to_json_native(&buffer));
}
