# TakeDriveOwnership

เปลี่ยนความเป็นเจ้าของไฟล์ & แก้ปัญหาสิทธิ์ไดรฟ์บน Windows

![License](https://img.shields.io/badge/license-GPL--3.0-green)
![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078d4)
![Built with](https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20Rust-24c8db)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?logo=buymeacoffee&logoColor=white)](https://buymeacoffee.com/zuaq)

[English](README.md) | **ภาษาไทย**

เครื่องมือ Windows ขนาดเล็กสำหรับแก้ปัญหาสิทธิ์ NTFS เมื่อย้ายฮาร์ดดิสก์ (HDD/SSD) จากเครื่องหนึ่งไปอีกเครื่อง แก้ปัญหา "Access Denied", ไฟล์ Excel เปิดแบบอ่านอย่างเดียว, ไฟล์ถูกบล็อกจาก Windows เนื่องจาก SID ไม่ตรง, ไม่มีสิทธิ์ ACL, และ Zone Identifier (Mark of the Web) สร้างด้วย Tauri v2 (Rust + HTML/CSS/JS) ไฟล์ `.exe` เดียว ไม่ต้องติดตั้ง

> **ปัญหาที่โปรแกรมนี้แก้ได้:** เปลี่ยนเจ้าของไฟล์ Windows, แก้สิทธิ์ไดรฟ์, Access Denied ย้ายฮาร์ดดิสก์, Excel Protected View หลังย้ายไดรฟ์, แก้สิทธิ์ NTFS, รีเซ็ตเจ้าของไฟล์, icacls แก้สิทธิ์ทั้งไดรฟ์, ลบ Mark of the Web, ปลดบล็อกไฟล์จากเครื่องอื่น, takeown Windows 10, แก้ไฟล์อ่านอย่างเดียว

---

## ทำไมถึงต้องใช้โปรแกรมนี้

เมื่อย้ายฮาร์ดดิสก์ (HDD/SSD) จากเครื่อง Windows เครื่องหนึ่งไปอีกเครื่อง จะเจอปัญหาเหล่านี้:

- **"Access Denied"** เปิดหรือบันทึกไฟล์ไม่ได้
- **Excel เปิดแบบอ่านอย่างเดียว / Protected View** แก้ไขไม่ได้
- **ไฟล์ถูก "บล็อก"** — Windows แจ้งว่าไฟล์มาจากเครื่องอื่น
- **ลบหรือเปลี่ยนชื่อไฟล์ไม่ได้** ทั้งที่เคยเป็นเจ้าของ

สาเหตุเพราะ Windows NTFS เก็บความเป็นเจ้าของและสิทธิ์ไว้กับ user account เฉพาะ (SID) เมื่อย้ายไดรฟ์ไปเครื่องใหม่ user ใหม่ไม่ตรงกับของเก่า — Windows จึงบล็อกการเข้าถึง

## สาเหตุของปัญหา

| สาเหตุ | รายละเอียดทางเทคนิค | อาการ |
|--------|---------------------|-------|
| **SID ไม่ตรง** | ไฟล์เป็นของ user เครื่องเก่า (SID ต่างกัน) | เครื่องใหม่เขียนไม่ได้ — "Access Denied" |
| **ไม่มีสิทธิ์ ACL** | user ใหม่ไม่อยู่ใน access control list | ไม่มีสิทธิ์อ่าน/เขียน |
| **อ่านอย่างเดียว** | ไฟล์ถูกตั้งเป็น read-only | เปิดได้แต่บันทึกไม่ได้ |
| **Zone Identifier (MOTW)** | alternate data stream ระบุว่าไฟล์ "มาจากเครื่องอื่น" | Windows/Excel บล็อกไฟล์ |

## โปรแกรมนี้ทำอะไร

แก้ไข 4 ขั้นตอนอัตโนมัติกับทุกไฟล์ที่มีปัญหา:

| ขั้นตอน | คำสั่ง | ทำอะไร |
|---------|--------|--------|
| 1. **เปลี่ยนเจ้าของ** | `takeown` | โอนความเป็นเจ้าของจาก user เก่ามาเป็นของคุณ |
| 2. **ให้สิทธิ์เต็ม** | `icacls /c` | เพิ่มสิทธิ์ full-control ให้ Administrators + user ปัจจุบัน ใช้ `/c` ข้ามไฟล์ที่ error |
| 3. **ปลดอ่านอย่างเดียว** | `attrib -R` | ลบ read-only attribute |
| 4. **ปลดบล็อกไฟล์** | ลบ `:Zone.Identifier` | ลบ alternate data stream ที่ทำให้ไฟล์ถูกบล็อก |

## โหมดการแก้ไข

| โหมด | วิธีทำงาน | ข้อดี | ข้อเสีย |
|------|----------|-------|---------|
| **Quick Fix** | รัน `takeown /r`, `icacls /t /c`, `attrib /S /D` ทั้งไดรฟ์ แล้ว unblock ทีเดียว | เร็วที่สุด — Windows จัดการ recursion เอง | ไม่มีรายงานรายไฟล์ |
| **Scan & Fix** | สแกนทุกไฟล์ด้วย native Rust (ไม่ใช้ PowerShell) หาไฟล์ที่มีปัญหา แล้วแก้เฉพาะไฟล์นั้น | รายงานครบ — จัดกลุ่มตามสาเหตุและประเภทไฟล์ | ช้ากว่าเพราะต้องสแกนก่อน |
| **Fix Specific Folder** | เหมือน Scan & Fix แต่เฉพาะโฟลเดอร์ที่เลือก | รายงานครบ + เร็วกว่าสแกนทั้งไดรฟ์ | แก้แค่โฟลเดอร์ที่เลือก |

### ประสิทธิภาพ

คอขวดคือ **disk I/O** (อ่าน/เขียนสิทธิ์ไฟล์) ไม่ใช่ตัวโปรแกรม โปรแกรมใช้ CPU แทบเป็นศูนย์

| ปัจจัย | ผลกระทบ | เหตุผล |
|--------|---------|--------|
| **จำนวนไฟล์** | 1K = วินาที, 100K = นาที, 1M+ = 10+ นาที | แต่ละไฟล์ต้องอ่าน/เขียนสิทธิ์จากดิสก์ |
| **ประเภทดิสก์** | SSD เร็วกว่า HDD 3-5 เท่า | การแก้สิทธิ์เป็น random I/O |
| **แอนตี้ไวรัส** | ช้าลง 2-3 เท่า | AV สแกนทุกครั้งที่เปลี่ยนสิทธิ์ |
| **โปรแกรมอื่นใช้ดิสก์** | ช้าลง | แบ่ง bandwidth ดิสก์กัน |

เวลาโดยประมาณสำหรับ 100,000 ไฟล์:

| โหมด | SSD | HDD | รายงาน |
|------|-----|-----|--------|
| Quick Fix | ~1-3 นาที | ~5-10 นาที | ไม่มี |
| Fix Specific Folder (1K ไฟล์) | ~5-15 วินาที | ~15-30 วินาที | ครบ |
| Scan & Fix (ทั้งไดรฟ์) | ~3-8 นาที | ~10-20 นาที | ครบ |

การตรวจหาปัญหาใช้ native Rust file check (ไมโครวินาทีต่อไฟล์) ไม่ใช้ PowerShell (ที่จะเพิ่ม ~300ms ต่อไฟล์)

## ฟีเจอร์

- **3 โหมดแก้ไข** — Quick Fix, Scan & Fix, Fix Specific Folder
- **ธีม Dark / Light** — สลับที่ title bar
- **ภาษา English / Thai** — สลับที่ title bar
- **แสดงผลแบบ real-time** — สถิติสด (สแกน / ปัญหา / แก้แล้ว / แก้ไม่ได้) พร้อม progress bar
- **สรุปผล** — จัดกลุ่มปัญหาตามสาเหตุ และไฟล์ที่แก้ตามนามสกุล
- **ส่งออก log** — บันทึกผลลัพธ์เป็นไฟล์ข้อความ
- **ขอสิทธิ์ Admin อัตโนมัติ** — แสดง UAC prompt เอง
- **Help overlay** — เอกสารในตัวเปรียบเทียบโหมดและประสิทธิภาพ
- **ไฟล์ .exe เดียว** — ไม่ต้องติดตั้ง ไม่ต้องลง runtime

## ดาวน์โหลด

ไปที่ [**Releases**](../../releases) แล้วดาวน์โหลดไฟล์ `.exe` ล่าสุด

ต้องใช้ **Windows 10 (version 1803 ขึ้นไป)** หรือ **Windows 11** ไดรฟ์ต้องเป็น NTFS เท่านั้น

## ความเข้ากันได้

| Windows | สถานะ | หมายเหตุ |
|---------|-------|----------|
| Windows 11 | รองรับ | ใช้งานได้เลย |
| Windows 10 (1803+) | รองรับ | อาจติดตั้ง WebView2 อัตโนมัติครั้งแรก |
| Windows 10 (ก่อน 1803) | ไม่รองรับ | Tauri v2 ต้องการ 1803 ขึ้นไป |
| Windows 8.1 / 8 / 7 | ไม่รองรับ | — |

## หลังแก้ไขแล้ว

ถ้า Excel ยังแสดง **Protected View** หลังรันโปรแกรมนี้ นั่นเป็นการตั้งค่าแยกของ Excel:

> File → Options → Trust Center → Trust Center Settings → Protected View → เอาติ๊กออกทั้ง 3 ช่อง

โปรแกรมนี้แก้สิทธิ์ไฟล์ของ Windows ส่วน Excel Trust Center เป็น security layer แยกต่างหาก

---

## สำหรับนักพัฒนา

### สิ่งที่ต้องมี

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) stable

### รันบนเครื่อง

```bash
npm install
npm run tauri dev
```

บน macOS/Linux จะใช้ mock data (ไดรฟ์จำลอง) สำหรับพัฒนา UI โค้ดเฉพาะ Windows อยู่หลัง `#[cfg(target_os = "windows")]`

### Build สำหรับ Windows

```bash
npm run tauri build
```

Output: `src-tauri/target/release/TakeDriveOwnership.exe`

Build อัตโนมัติผ่าน GitHub Actions เมื่อ push tag (ดู `.github/workflows/build.yml`)

### โครงสร้างโปรเจค

```
src/                        Frontend (HTML/CSS/JS ไม่ใช้ framework)
  index.html                หน้า UI, custom title bar แบบ frameless
  style.css                 ธีม Dark/Light ผ่าน CSS variables
  app.js                    Tauri IPC, แสดงไดรฟ์, logic การแก้ไข
  i18n.js                   แปลภาษา EN/TH + เนื้อหา help
  theme.js                  สลับธีม

src-tauri/                  Backend (Rust)
  src/
    main.rs                 จุดเริ่มต้น
    lib.rs                  ลงทะเบียน Tauri plugin + command
    commands/
      drives.rs             ตรวจจับไดรฟ์ (PowerShell บน Windows, mock บน macOS)
      fix.rs                การแก้ไข — 3 โหมด พร้อม progress streaming
```

**การตัดสินใจด้านเทคนิค:**
- ใช้ native Rust file check แทน PowerShell สำหรับตรวจหาปัญหา (เร็วกว่า ~30,000 เท่า)
- `icacls /c` ข้าม error แล้วทำต่อไม่หยุดกลางทาง
- โฟลเดอร์ใน scan mode ไม่ใช้ `/r /t` เพื่อไม่แก้ไฟล์ลูกซ้ำ
- Progress event ส่งผ่าน `app.emit()` อัปเดต UI แบบ real-time ไม่ต้อง polling
- ใช้ `CREATE_NO_WINDOW` flag ทุก subprocess ไม่ให้ console กระพริบ

## ร่วมพัฒนา

ยินดีรับ Issues และ Pull Requests กรุณาทดสอบบน Windows จริงกับไดรฟ์ที่ย้ายมาจริง — mock mode บน macOS ทดสอบได้แค่ UI

## ลิขสิทธิ์

[GPL-3.0](LICENSE)

ซอฟต์แวร์นี้เป็นโอเพนซอร์สและฟรี คุณสามารถใช้ แก้ไข และแจกจ่ายได้ภายใต้เงื่อนไขของ GNU General Public License v3.0 งานที่ดัดแปลงต้องเป็นโอเพนซอร์สภายใต้ลิขสิทธิ์เดียวกัน

---

ถ้าโปรแกรมนี้ช่วยคุณได้ พิจารณา[ซื้อกาแฟให้ผมสักแก้ว](https://buymeacoffee.com/zuaq)
