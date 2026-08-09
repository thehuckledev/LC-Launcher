//- TODO add controller mode which is like steam big screen mode
//- TODO make instances appear as games in steam
//* TODO add dev tools like .arc .pak and .loc editor
//* TODO make each profile have multiple skins and capes
//* TODO add friend, chat and join game system (maybe compatible with emerald launcher) (use that rounded gray breathing colour boxes as placeholders) (have a rlly cool eligant login animation)
//* TODO add LCE Workshop and make a good website for it
// TODO make worlds menu work
// TODO add a corrupted installation fix menu
// TODO convert LCE world to Java worlds. https://je2be.app
// TODO add multiplayer overlays to show notifications when playing lce
// TODO add realms which basically uses multiplayer system BUT if someone hosting u join their game otherwise u download world from server and host it, then u save to server when u exit.
// TODO add world backups online, dont add until 20th march cause neo will kill u.
// TODO add a extension system to the launcher itself so u can add stuff.
// TODO add a way to view achivements inside the launcher
// TODO make a full auto update where it downloads inside the launcher, checksum and then launches, quits current (do check on load progress bar and then use that progress bar as download progress)
// TODO make logs from last game still visible so the button stays pressable
// TODO add a custom cape history section
// TODO have another dlc inside the game called Profile History wheree its the last 5 skins selected

// BUGS PEOPLE HAVE
/*
windows:
- waiting for extension

linux:
- please install libwebkit2gtk-4.0-37 or libwebkit2gtk-4.1-0 library to run this application. arch based / cachy os / gentoo

macos:
*/

// WHAT IVE DONE
// fixed issue where you can change and edit instances while installing one
// optimised downloading/unzipping progress message by adding an interval check
// fixed websocket streaming game logs isnt fast enough as it is always behind
// fixed custom cape upload issue
// fixed snail cape not rendering/applying
// made stop/start instance spam proof