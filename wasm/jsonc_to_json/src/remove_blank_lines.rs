pub fn remove_blank_lines_native(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut output = Vec::with_capacity(bytes.len());
    let mut line_buffer: Vec<u8> = Vec::new();
    let mut has_content = false;
    let mut i = 0;

    while i < bytes.len() {
        let ch = bytes[i];
        if ch == b'\r' || ch == b'\n' {
            let mut newline = vec![ch];
            if ch == b'\r' && i + 1 < bytes.len() && bytes[i + 1] == b'\n' {
                newline.push(b'\n');
                i += 1;
            }
            if has_content {
                output.extend_from_slice(&line_buffer);
                output.extend_from_slice(&newline);
            }
            line_buffer.clear();
            has_content = false;
            i += 1;
            continue;
        }

        line_buffer.push(ch);
        if ch != b' ' && ch != b'\t' {
            has_content = true;
        }
        i += 1;
    }

    if has_content {
        output.extend_from_slice(&line_buffer);
    }

    String::from_utf8(output).expect("remove_blank_lines_native produced invalid UTF-8")
}
