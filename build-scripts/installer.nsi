; Huge thanks to https://github.com/Midrags/SFF/blob/main/installer.nsi

!define APPNAME "LC Launcher"
!define SAFEAPPNAME "LCLauncher"
!ifndef VERSION
    !define VERSION "0.1.0"
!endif
!define EXENAME "LC Launcher.exe"
!define AUTHOR "TheHuckle"

Name "${APPNAME}"
OutFile "..\dist\${SAFEAPPNAME}-win-x64-Setup.exe"

InstallDir "$PROGRAMFILES\${APPNAME}"
InstallDirRegKey HKCU "Software\${AUTHOR}\${APPNAME}" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
BrandingText "${APPNAME}"



!include "MUI2.nsh"
!include "x64.nsh"
!include "Sections.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "..\assets\nsis\icon_small.ico"
!define MUI_UNICON "..\assets\nsis\icon_uninstall.ico"

!define MUI_WELCOMEPAGE_TITLE "Install ${APPNAME} ${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "This will install ${APPNAME} ${VERSION} on your computer.$\r$\n$\r$\nClick Next to continue."

!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch ${APPNAME}"
!define MUI_FINISHPAGE_LINK "Visit GitHub"
!define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/thehuckledev/LC-Launcher"

!define MUI_WELCOMEFINISHPAGE_BITMAP "..\assets\nsis\mui_sidebar.bmp"

; Dark mode
!define MUI_INSTFILESPAGE_COLORS "FFFFFF 2D2D2D"
!define MUI_LICENSEPAGE_BGCOLOR "2D2D2D"
!define MUI_LICENSEPAGE_TEXTCOLOR "FFFFFF"

!define MUI_BGCOLOR "2D2D2D"

Function .onGUIInit
    SetCtlColors $HWNDPARENT "FFFFFF" "2D2D2D"
FunctionEnds

Function .onGuiPageChange
    SetCtlColors $HWNDPARENT "FFFFFF" "2D2D2D"
FunctionEnd

; Installer pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"



; Require 64 bit msg box
Function .onInit
    ${Unless} ${RunningX64}
        MessageBox MB_OK|MB_ICONSTOP "This installer requires a 64-bit version of Windows."
        Abort
    ${EndUnless}
FunctionEnd



Section "${APPNAME} (Required)" SEC_MAIN
    SectionIn RO

    SetOutPath "$INSTDIR"
    File /r "..\dist\win_x64\*.*"

    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; Add/Remove programs settings menu
    SetRegView 64
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayVersion" "${VERSION}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "Publisher" "${AUTHOR}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayIcon" "$INSTDIR\icon.ico"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "QuietUninstallString" '"$INSTDIR\Uninstall.exe" /S'
    WriteRegStr HKCU "Software\${AUTHOR}\${APPNAME}" "InstallDir" "$INSTDIR"

    ; Windows defender exclusion
    MessageBox MB_YESNO|MB_ICONINFORMATION \
        "${APPNAME} can be added to Windows Defender exclusions.$\r$\n$\r$\nThis prevents the download tool from being flagged as a false positive.$\r$\n$\r$\nAdd exclusion now?" \
        IDNO skip_defender

    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Add-MpPreference -ExclusionPath $\"$INSTDIR$\""'

    skip_defender:
SectionEnd

Section "Desktop Shortcut" SEC_DESKTOP
    CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\icon.ico"
SectionEnd

Section "Start Menu Shortcut" SEC_STARTMENU
    CreateDirectory "$SMPROGRAMS\${APPNAME}"
    CreateShortcut  "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"  "$INSTDIR\${EXENAME}" "" "$INSTDIR\icon.ico"
    CreateShortcut  "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"   "$INSTDIR\Uninstall.exe"
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
    !insertmacro MUI_DESCRIPTION_TEXT ${SEC_MAIN} "Core application files (Required)"
    !insertmacro MUI_DESCRIPTION_TEXT ${SEC_DESKTOP} "Add a shortcut on your Desktop"
    !insertmacro MUI_DESCRIPTION_TEXT ${SEC_STARTMENU} "Add a shortcut in the Start Menu"
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section "Uninstall"
    nsExec::ExecToLog 'taskkill /F /IM "${EXENAME}" /T'

    RMDir /r "$INSTDIR"
    RMDir /r "$APPDATA\${EXENAME}"
    
    Delete "$DESKTOP\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"
    RMDir  "$SMPROGRAMS\${APPNAME}"
    
    ; Remove from Add/Remove programs settings menu
    SetRegView 64
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
    DeleteRegKey HKCU "Software\${AUTHOR}\${APPNAME}"

    ; Remove windows defender exclusion
    nsExec::ExecToLog 'powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Remove-MpPreference -ExclusionPath $\"$INSTDIR$\""'
SectionEnd