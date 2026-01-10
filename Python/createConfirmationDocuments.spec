# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs

block_cipher = None

a = Analysis(
    ['createConfirmationDocuments.py'],
    pathex=[],
    binaries=[
        # Explicitly include PyMuPDF DLLs
        *collect_dynamic_libs('fitz'),
    ],
    datas=[
        # Include image files from models directory
        ('models/donate.jpeg', 'models'),
        ('models/logoEN.jpeg', 'models'),
        ('models/logoFR.jpeg', 'models'),
        # Include all PyMuPDF data files (fonts, CMaps, etc.)
        *collect_data_files('fitz'),
    ],
    hiddenimports=[
        'PyPDF2',
        'docx',
        'fitz',           # Main module
        'fitz.fitz',      # C extension module
        'fitz.utils',     # Utility functions
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary packages to reduce size
        'tkinter', 'matplotlib', 'numpy', 'pandas',
        'scipy', 'pytest', 'IPython', 'notebook',
        'PIL.ImageQt', 'PyQt5', 'PySide2',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='createConfirmationDocuments',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='createConfirmationDocuments',
)
