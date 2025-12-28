pub fn strip_comments_native(input: &str) -> String {
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

        if ch == b'/' && i + 1 < bytes.len() {
            let next = bytes[i + 1];
            if next == b'/' {
                trim_trailing_inline_whitespace(&mut output);
                i += 2;
                while i < bytes.len() {
                    let comment_char = bytes[i];
                    if comment_char == b'\r' {
                        output.push(b'\r');
                        i += 1;
                        if i < bytes.len() && bytes[i] == b'\n' {
                            output.push(b'\n');
                            i += 1;
                        }
                        break;
                    }
                    if comment_char == b'\n' {
                        output.push(b'\n');
                        i += 1;
                        break;
                    }
                    i += 1;
                }
                continue;
            }

            if next == b'*' {
                trim_trailing_inline_whitespace(&mut output);
                i += 2;
                while i < bytes.len() {
                    let comment_char = bytes[i];
                    if comment_char == b'*' && i + 1 < bytes.len() && bytes[i + 1] == b'/' {
                        i += 2;
                        break;
                    }
                    if comment_char == b'\r' {
                        output.push(b'\r');
                        i += 1;
                        if i < bytes.len() && bytes[i] == b'\n' {
                            output.push(b'\n');
                            i += 1;
                        }
                        continue;
                    }
                    if comment_char == b'\n' {
                        output.push(b'\n');
                        i += 1;
                        continue;
                    }
                    i += 1;
                }
                continue;
            }
        }

        output.push(ch);
        i += 1;
    }

    String::from_utf8(output).expect("strip_comments_native produced invalid UTF-8")
}

fn trim_trailing_inline_whitespace(output: &mut Vec<u8>) {
    while let Some(&last) = output.last() {
        if last == b' ' || last == b'\t' {
            output.pop();
            continue;
        }
        if last == b'\n' || last == b'\r' {
            break;
        }
        break;
    }
}
