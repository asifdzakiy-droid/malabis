@echo off
setlocal enabledelayedexpansion

:: Meminta kode huruf dari user
set /p prefix=Masukkan kode huruf: 

echo Mendeteksi nomor terakhir...

set maxnum=0

:: Cari file yang sudah ada kodenya, contoh: KODE-0005.jpg
for %%f in (%prefix%-*.jpg %prefix%-*.jpeg %prefix%-*.png %prefix%-*.webp) do (
    set fname=%%~nf
    :: Ambil nomor setelah prefix-
    for /f "tokens=2 delims=-" %%x in ("!fname!") do (
        set num=%%x
        :: Hapus leading zero
        set /a num2=1!num!-10000
        :: Update maxnum jika lebih besar
        if !num2! gtr !maxnum! set maxnum=!num2!
    )
)

echo Nomor terakhir ditemukan: !maxnum!

:: Mulai nomor berikutnya
set /a count=maxnum+1

echo Memulai rename dari nomor !count!

:: Rename semua file gambar yang BELUM memiliki prefix (hanya file tanpa kode)
for %%f in (*.jpg *.jpeg *.png *.webp) do (
    echo %%f | findstr /i "^%prefix%-" >nul
    if errorlevel 1 (
        set num=0000!count!
        set num=!num:~-4!

        set ext=%%~xf
        ren "%%f" "%prefix%-!num!!ext!"
        echo Rename: %%f → %prefix%-!num!!ext!
        set /a count+=1
    )
)

echo Selesai!
pause
