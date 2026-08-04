const capeTextures = import.meta.glob('/assets/capes/**/*.{png,webp}', {
    eager: true,
    import: 'default'
});

export class Capes {
    constructor(manager) {
        this.manager = manager;
    };

    #resolvePath(path) {
        return capeTextures[path] || path;
    };

    list() {
        const capeData = [
            {
                category: "Featured",
                items: [
                    {
                        id: "lc-launcher",
                        name: "LC Launcher",
                        path: "/assets/capes/LC-Launcher/texture.png",
                        previewUrl: "/assets/capes/LC-Launcher/preview.webp"
                    }
                ]
            },
            {
                category: "Account",
                items: [
                    {
                        id: "pan",
                        name: "Pancape",
                        path: "/assets/capes/Pan/texture.png",
                        previewUrl: "/assets/capes/Pan/preview.webp"
                    },
                    {
                        id: "migrator",
                        name: "Migrator",
                        path: "/assets/capes/Migrator/texture.webp",
                        previewUrl: "/assets/capes/Migrator/preview.webp"
                    },
                    {
                        id: "vanilla",
                        name: "Vanilla",
                        path: "/assets/capes/Vanilla/texture.webp",
                        previewUrl: "/assets/capes/Vanilla/preview.webp"
                    },
                    {
                        id: "common",
                        name: "Common",
                        path: "/assets/capes/Common/texture.webp",
                        previewUrl: "/assets/capes/Common/preview.webp"
                    }
                ]
            },
            {
                category: "Staff",
                items: [
                    {
                        id: "4j-studios",
                        name: "4J Studios",
                        path: "/assets/capes/4J-Studios/texture.webp",
                        previewUrl: "/assets/capes/4J-Studios/preview.webp"
                    },
                    {
                        id: "mojang",
                        name: "Mojang",
                        path: "/assets/capes/Mojang/texture.png",
                        previewUrl: "/assets/capes/Mojang/preview.webp"
                    },
                    {
                        id: "mojang-classic",
                        name: "Mojang (Classic)",
                        path: "/assets/capes/Mojang-Classic/texture.webp",
                        previewUrl: "/assets/capes/Mojang-Classic/preview.webp"
                    },
                    {
                        id: "mojang-studios",
                        name: "Mojang Studios",
                        path: "/assets/capes/Mojang-Studios/texture.webp",
                        previewUrl: "/assets/capes/Mojang-Studios/preview.webp"
                    },
                    {
                        id: "xbox",
                        name: "Xbox",
                        path: "/assets/capes/Xbox/texture.webp",
                        previewUrl: "/assets/capes/Xbox/preview.webp"
                    }
                ]
            },
            {
                category: "Physical Events",
                items: [
                    {
                        id: "minecon-2011",
                        name: "Minecon 2011",
                        path: "/assets/capes/Minecon-2011/texture.webp",
                        previewUrl: "/assets/capes/Minecon-2011/preview.webp"
                    },
                    {
                        id: "minecon-2012",
                        name: "Minecon 2012",
                        path: "/assets/capes/Minecon-2012/texture.webp",
                        previewUrl: "/assets/capes/Minecon-2012/preview.webp"
                    },
                    {
                        id: "minecon-2013",
                        name: "Minecon 2013",
                        path: "/assets/capes/Minecon-2013/texture.png",
                        previewUrl: "/assets/capes/Minecon-2013/preview.webp"
                    },
                    {
                        id: "minecon-2015",
                        name: "Minecon 2015",
                        path: "/assets/capes/Minecon-2015/texture.png",
                        previewUrl: "/assets/capes/Minecon-2015/preview.webp"
                    },
                    {
                        id: "minecon-2016",
                        name: "Minecon 2016",
                        path: "/assets/capes/Minecon-2016/texture.png",
                        previewUrl: "/assets/capes/Minecon-2016/preview.webp"
                    },
                    {
                        id: "minecraft-experience",
                        name: "Minecraft Experience",
                        path: "/assets/capes/Minecraft-Experience/texture.webp",
                        previewUrl: "/assets/capes/Minecraft-Experience/preview.webp"
                    },
                    {
                        id: "moonlight-trail",
                        name: "Moonlight Trail",
                        path: "/assets/capes/Moonlight-Trail/texture.webp",
                        previewUrl: "/assets/capes/Moonlight-Trail/preview.webp"
                    },
                    {
                        id: "crafter",
                        name: "Crafter",
                        path: "/assets/capes/Crafter/texture.webp",
                        previewUrl: "/assets/capes/Crafter/preview.webp"
                    }
                ]
            },
            {
                category: "Virtual Events",
                items: [
                    {
                        id: "founders",
                        name: "Founder's",
                        path: "/assets/capes/Founders/texture.webp",
                        previewUrl: "/assets/capes/Founders/preview.webp"
                    },
                    {
                        id: "progress-pride",
                        name: "Progress Pride",
                        path: "/assets/capes/Progress-Pride/texture.webp",
                        previewUrl: "/assets/capes/Progress-Pride/preview.webp"
                    },
                    {
                        id: "cherry-blossom",
                        name: "Cherry Blossom",
                        path: "/assets/capes/Cherry-Blossom/texture.webp",
                        previewUrl: "/assets/capes/Cherry-Blossom/preview.webp"
                    },
                    {
                        id: "followers",
                        name: "Follower's",
                        path: "/assets/capes/Followers/texture.webp",
                        previewUrl: "/assets/capes/Followers/preview.webp"
                    },
                    {
                        id: "purple-heart",
                        name: "Purple Heart",
                        path: "/assets/capes/Purple-Heart/texture.webp",
                        previewUrl: "/assets/capes/Purple-Heart/preview.webp"
                    },
                    {
                        id: "15th-anniversary",
                        name: "15th Anniversary",
                        path: "/assets/capes/15th-Anniversary/texture.webp",
                        previewUrl: "/assets/capes/15th-Anniversary/preview.webp"
                    },
                    {
                        id: "mcc-15th-year",
                        name: "MCC 15th Year",
                        path: "/assets/capes/MCC-15th-Year/texture.webp",
                        previewUrl: "/assets/capes/MCC-15th-Year/preview.webp"
                    },
                    {
                        id: "mojang-office",
                        name: "Mojang Office",
                        path: "/assets/capes/Mojang-Office/texture.webp",
                        previewUrl: "/assets/capes/Mojang-Office/preview.webp"
                    },
                    {
                        id: "home",
                        name: "Home",
                        path: "/assets/capes/Home/texture.png",
                        previewUrl: "/assets/capes/Home/preview.webp"
                    },
                    {
                        id: "menace",
                        name: "Menace",
                        path: "/assets/capes/Menace/texture.png",
                        previewUrl: "/assets/capes/Menace/preview.webp"
                    },
                    {
                        id: "yearn",
                        name: "Yearn",
                        path: "/assets/capes/Yearn/texture.webp",
                        previewUrl: "/assets/capes/Yearn/preview.webp"
                    },
                    {
                        id: "copper",
                        name: "Copper",
                        path: "/assets/capes/Copper/texture.webp",
                        previewUrl: "/assets/capes/Copper/preview.webp"
                    },
                    {
                        id: "zombie-horse",
                        name: "Zombie Horse",
                        path: "/assets/capes/Zombie-Horse/texture.webp",
                        previewUrl: "/assets/capes/Zombie-Horse/preview.webp"
                    },
                    {
                        id: "builder",
                        name: "Builder",
                        path: "/assets/capes/Builder/texture.webp",
                        previewUrl: "/assets/capes/Builder/preview.webp"
                    }
                ]
            },
            {
                category: "Personal",
                items: [
                    {
                        id: "bacon",
                        name: "Bacon",
                        path: "/assets/capes/Bacon/texture.png",
                        previewUrl: "/assets/capes/Bacon/preview.webp"
                    },
                    {
                        id: "millionth-customer",
                        name: "Millionth Customer",
                        path: "/assets/capes/Millionth-Customer/texture.webp",
                        previewUrl: "/assets/capes/Millionth-Customer/preview.webp"
                    },
                    {
                        id: "db",
                        name: "dB (DannyBstyle)",
                        path: "/assets/capes/dB/texture.png",
                        previewUrl: "/assets/capes/dB/preview.webp"
                    },
                    {
                        id: "snowman",
                        name: "Snowman (JulianClark)",
                        path: "/assets/capes/Snowman/texture.png",
                        previewUrl: "/assets/capes/Snowman/preview.webp"
                    },
                    {
                        id: "cheapsh0t",
                        name: "cheapsh0t",
                        path: "/assets/capes/cheapsh0t/texture.webp",
                        previewUrl: "/assets/capes/cheapsh0t/preview.webp"
                    },
                    {
                        id: "spade",
                        name: "Spade (mrfreshmanly)",
                        path: "/assets/capes/Spade/texture.webp",
                        previewUrl: "/assets/capes/Spade/preview.webp"
                    },
                    {
                        id: "prismarine",
                        name: "Prismarine (Drullkus)",
                        path: "/assets/capes/Prismarine/texture.png",
                        previewUrl: "/assets/capes/Prismarine/preview.webp"
                    },
                    {
                        id: "turtle",
                        name: "Turtle (BillyK_)",
                        path: "/assets/capes/Turtle/texture.png",
                        previewUrl: "/assets/capes/Turtle/preview.webp"
                    },
                    {
                        id: "birthday",
                        name: "Birthday (Grins)",
                        path: "/assets/capes/Birthday/texture.webp",
                        previewUrl: "/assets/capes/Birthday/preview.webp"
                    },
                    {
                        id: "valentine",
                        name: "Valentine (Mickerson)",
                        path: "/assets/capes/Valentine/texture.webp",
                        previewUrl: "/assets/capes/Valentine/preview.webp"
                    },
                    {
                        id: "oxeye",
                        name: "Oxeye (aka_Bip)",
                        path: "/assets/capes/Oxeye/texture.webp",
                        previewUrl: "/assets/capes/Oxeye/preview.webp"
                    },
                    {
                        id: "blueprint",
                        name: "Blueprint (Grum)",
                        path: "/assets/capes/Blueprint/texture.webp",
                        previewUrl: "/assets/capes/Blueprint/preview.webp"
                    }
                ]
            },
            {
                category: "Competitions",
                items: [
                    {
                        id: "scrolls-champion",
                        name: "Scrolls Champion",
                        path: "/assets/capes/Scrolls-Champion/texture.png",
                        previewUrl: "/assets/capes/Scrolls-Champion/preview.webp"
                    },
                    {
                        id: "cobalt",
                        name: "Cobalt",
                        path: "/assets/capes/Cobalt/texture.png",
                        previewUrl: "/assets/capes/Cobalt/preview.webp"
                    }
                ]
            },
            {
                category: "Volunteer",
                items: [
                    {
                        id: "translator",
                        name: "Translator",
                        path: "/assets/capes/Translator/texture.webp",
                        previewUrl: "/assets/capes/Translator/preview.webp"
                    },
                    {
                        id: "chinese-translator",
                        name: "Chinese Translator",
                        path: "/assets/capes/Chinese-Translator/texture.webp",
                        previewUrl: "/assets/capes/Chinese-Translator/preview.webp"
                    },
                    {
                        id: "moderator",
                        name: "Moderator",
                        path: "/assets/capes/Moderator/texture.webp",
                        previewUrl: "/assets/capes/Moderator/preview.webp"
                    },
                    {
                        id: "realms-mapmaker",
                        name: "Realms MapMaker",
                        path: "/assets/capes/Realms-MapMaker/texture.png",
                        previewUrl: "/assets/capes/Realms-MapMaker/preview.webp"
                    }
                ]
            },
            {
                category: "Temporary",
                items: [
                    {
                        id: "christmas-2010",
                        name: "Christmas 2010",
                        path: "/assets/capes/Christmas-2010/texture.png",
                        previewUrl: "/assets/capes/Christmas-2010/preview.webp"
                    },
                    {
                        id: "new-year-2011",
                        name: "New Year 2011",
                        path: "/assets/capes/New-Year-2011/texture.png",
                        previewUrl: "/assets/capes/New-Year-2011/preview.webp"
                    },
                    {
                        id: "xbox-1st-birthday",
                        name: "Xbox 1st Birthday",
                        path: "/assets/capes/Xbox-1st-Birthday/texture.webp",
                        previewUrl: "/assets/capes/Xbox-1st-Birthday/preview.webp"
                    }
                ]
            },
            {
                category: "Other & Unused",
                items: [
                    {
                        id: "awesom",
                        name: "Awesom",
                        path: "/assets/capes/Awesom/texture.webp",
                        previewUrl: "/assets/capes/Awesom/preview.webp"
                    },
                    {
                        id: "blonk",
                        name: "Blonk",
                        path: "/assets/capes/Blonk/texture.webp",
                        previewUrl: "/assets/capes/Blonk/preview.webp"
                    },
                    {
                        id: "frog",
                        name: "Frog",
                        path: "/assets/capes/Frog/texture.webp",
                        previewUrl: "/assets/capes/Frog/preview.webp"
                    },
                    {
                        id: "minecon-2",
                        name: "Minecon 2",
                        path: "/assets/capes/Minecon-2/texture.webp",
                        previewUrl: "/assets/capes/Minecon-2/preview.webp"
                    },
                    {
                        id: "minecon-3",
                        name: "Minecon 3",
                        path: "/assets/capes/Minecon-3/texture.webp",
                        previewUrl: "/assets/capes/Minecon-3/preview.webp"
                    },
                    {
                        id: "minecon-4",
                        name: "Minecon 4",
                        path: "/assets/capes/Minecon-4/texture.webp",
                        previewUrl: "/assets/capes/Minecon-4/preview.webp"
                    },
                    {
                        id: "no-circle",
                        name: "No Circle",
                        path: "/assets/capes/No-Circle/texture.webp",
                        previewUrl: "/assets/capes/No-Circle/preview.webp"
                    },
                    {
                        id: "nyan",
                        name: "Nyan",
                        path: "/assets/capes/Nyan/texture.webp",
                        previewUrl: "/assets/capes/Nyan/preview.webp"
                    },
                    {
                        id: "size-m",
                        name: "Size M",
                        path: "/assets/capes/size-m/texture.webp",
                        previewUrl: "/assets/capes/size-m/preview.webp"
                    },
                    {
                        id: "snail",
                        name: "Snail",
                        path: "/assets/capes/snail/texture.webp",
                        previewUrl: "/assets/capes/snail/preview.webp"
                    },
                    {
                        id: "squid",
                        name: "Squid",
                        path: "/assets/capes/Squid/texture.webp",
                        previewUrl: "/assets/capes/Squid/preview.webp"
                    },
                    {
                        id: "veterinarian",
                        name: "Veterinarian",
                        path: "/assets/capes/Veterinarian/texture.webp",
                        previewUrl: "/assets/capes/Veterinarian/preview.webp"
                    }
                ]
            },
            {
                category: "TWoM",
                items: [
                    {
                        id: "twom-3",
                        name: "TWoM 3",
                        path: "/assets/capes/TWoM-3/texture.webp",
                        previewUrl: "/assets/capes/TWoM-3/preview.webp"
                    },
                    {
                        id: "twom-4",
                        name: "TWoM 4",
                        path: "/assets/capes/TWoM-4/texture.webp",
                        previewUrl: "/assets/capes/TWoM-4/preview.webp"
                    },
                    {
                        id: "twom-5",
                        name: "TWoM 5",
                        path: "/assets/capes/TWoM-5/texture.webp",
                        previewUrl: "/assets/capes/TWoM-5/preview.webp"
                    },
                    {
                        id: "twom-6",
                        name: "TWoM 6",
                        path: "/assets/capes/TWoM-6/texture.webp",
                        previewUrl: "/assets/capes/TWoM-6/preview.webp"
                    },
                    {
                        id: "twom-7",
                        name: "TWoM 7",
                        path: "/assets/capes/TWoM-7/texture.webp",
                        previewUrl: "/assets/capes/TWoM-7/preview.webp"
                    },
                    {
                        id: "twom-8",
                        name: "TWoM 8",
                        path: "/assets/capes/TWoM-8/texture.webp",
                        previewUrl: "/assets/capes/TWoM-8/preview.webp"
                    },
                    {
                        id: "twom-10",
                        name: "TWoM 10",
                        path: "/assets/capes/TWoM-10/texture.webp",
                        previewUrl: "/assets/capes/TWoM-10/preview.webp"
                    },
                    {
                        id: "twom-11",
                        name: "TWoM 11",
                        path: "/assets/capes/TWoM-11/texture.webp",
                        previewUrl: "/assets/capes/TWoM-11/preview.webp"
                    },
                    {
                        id: "twom-12",
                        name: "TWoM 12",
                        path: "/assets/capes/TWoM-12/texture.webp",
                        previewUrl: "/assets/capes/TWoM-12/preview.webp"
                    },
                    {
                        id: "twom-13",
                        name: "TWoM 13",
                        path: "/assets/capes/TWoM-13/texture.webp",
                        previewUrl: "/assets/capes/TWoM-13/preview.webp"
                    },
                    {
                        id: "twom-16",
                        name: "TWoM 16",
                        path: "/assets/capes/TWoM-16/texture.webp",
                        previewUrl: "/assets/capes/TWoM-16/preview.webp"
                    }
                ]
            }
        ];

        return capeData.map(catagory => ({
            ...catagory,
            items: catagory.items.map(item => ({
                ...item,
                path: this.#resolvePath(item.path),
                previewUrl: this.#resolvePath(item.previewUrl)
            }))
        }));
    };
};