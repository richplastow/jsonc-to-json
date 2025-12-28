pub fn remove_trailing_commas_native(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut output = Vec::with_capacity(bytes.len());
    let mut i = 0;
    let mut in_string = false;
    let mut string_delimiter = b'"';

    while i < bytes.len() {
        let ch = bytes[i];

        if in_string {
            output.push(ch);
            if ch == b'\\' && i + 1 < bytes.len() {
                output.push(bytes[i + 1]);
                i += 2;
                continue;
            }
            if ch == string_delimiter {
                in_string = false;
            }
            i += 1;
            continue;
        }

        if ch == b'"' || ch == b'\'' {
            in_string = true;
            string_delimiter = ch;
            output.push(ch);
            i += 1;
            continue;
        }

        if ch == b',' {
            match next_non_whitespace_index(bytes, i + 1) {
                Some(idx) if bytes[idx] == b'}' || bytes[idx] == b']' => {
                    i += 1;
                    continue;
                }
                None => {
                    i += 1;
                    continue;
                }
                _ => {}
            }
        }

        output.push(ch);
        i += 1;
    }

    String::from_utf8(output).expect("remove_trailing_commas_native produced invalid UTF-8")
}

fn next_non_whitespace_index(bytes: &[u8], start: usize) -> Option<usize> {
    let mut idx = start;
    while idx < bytes.len() {
        let ch = bytes[idx];
        if ch != b' ' && ch != b'\t' && ch != b'\n' && ch != b'\r' {
            return Some(idx);
        }
        idx += 1;
    }
    None
}
