fn main() {
    // Embed admin manifest on Windows (requireAdministrator)
    #[cfg(target_os = "windows")]
    {
        let manifest = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>"#;
        std::fs::write("admin.manifest", manifest).expect("Failed to write manifest");
        println!("cargo:rustc-link-arg-bins=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg-bins=/MANIFESTINPUT:{}",
            std::path::Path::new("admin.manifest").canonicalize().unwrap().display());
        println!("cargo:rustc-link-arg-bins=/MANIFESTUAC:NO");
    }

    tauri_build::build();
}
