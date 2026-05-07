> Modified from [this gist](https://gist.github.com/Postrediori/10523cbd60dbb8ec45cddc2b77ac4143) to add VS 2026, 2022.

# MS Visual Studio Installers and ISO direct links

## Contents

* [VS 2026](#vs-2026)
* [VS 2022](#vs-2022)
* [VS 2019](#vs-2019)
* [VS 2017](#vs-2017)
  * [VS 2017 Express](#vs-2017-express)
* [VS 2015](#vs-2015)
  * [VS 2015 Original release (without updates)](#vs-2015-original-release-without-updates)
  * [VS 2015 Express](#vs-2015-express)
* [VS 2013](#vs-2013)
  * [VS 2013 RTM (Original release, without updates)](#vs-2013-rtm-original-release-without-updates)
  * [VS 2013 Express](#vs-2013-express)
* [VS 2012](#vs-2012)
  * [VS 2012 Express](#vs-2012-express)
* [VS 2010](#vs-2010)
  * [VS 2010 Express](#vs-2010-express)
* [VS 2008](#vs-2008)
  * [VS 2008 Express](#vs-2008-express)
* [VS 2005 Express](#vs-2005-express)
* [Documentation](#documentation)
  * [VS 2013 MSDN](#vs-2013-msdn)
  * [VS 2012 MSDN](#vs-2012-msdn)
  * [VS 2008 MSDN](#vs-2008-msdn)
* [Other links](#other-links)

## VS 2026

Official redirects:

```
https://aka.ms/vs/18/Stable/vs_community.exe
https://aka.ms/vs/18/Stable/vs_enterprise.exe
https://aka.ms/vs/18/Stable/vs_professional.exe
https://aka.ms/vs/18/Stable/vs_buildtools.exe
```

Direct links:

```
https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=community&channel=Stable&version=VS18

https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=enterprise&channel=Stable&version=VS18

https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=professional&channel=Stable&version=VS18
```

Source: https://gist.github.com/Chenx221/6f4ed72cd785d80edb0bc50c9921daf7

## VS 2022

Official redirects:

```
https://aka.ms/vs/17/release/vs_community.exe
https://aka.ms/vs/17/release/vs_enterprise.exe
https://aka.ms/vs/17/release/vs_professional.exe
https://aka.ms/vs/17/release/vs_buildtools.exe
```

Direct links:

```
https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=community&channel=Release&version=VS2022

https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=enterprise&channel=Release&version=VS2022

https://c2rsetup.officeapps.live.com/c2r/downloadVS.aspx?sku=professional&channel=Release&version=VS2022
```

Source: https://gist.github.com/Chenx221/6f4ed72cd785d80edb0bc50c9921daf7

## VS 2019

Official redirects:

```
https://aka.ms/vs/16/release/vs_community.exe
https://aka.ms/vs/16/release/vs_professional.exe
https://aka.ms/vs/16/release/vs_enterprise.exe
https://aka.ms/vs/16/release/vs_buildtools.exe
```

Direct links:

```
https://download.visualstudio.microsoft.com/download/pr/12569159-fcaa-4029-a83e-b7b900c5f9d6/9e0c2ffd45cb53f2596c6d55b66b9157a67f1b05244004c19410c5551ef1e318/vs_Community.exe

https://download.visualstudio.microsoft.com/download/pr/12569159-fcaa-4029-a83e-b7b900c5f9d6/3dc8194da5455450e5284c08f632cbfb6286bfb70a23dff16c1f739e0b578aae/vs_Professional.exe

https://download.visualstudio.microsoft.com/download/pr/12569159-fcaa-4029-a83e-b7b900c5f9d6/c9c2a125256d1f3bc421f52c39ec5c39b5a30579c5825ffea0842fae356d6caa/vs_Enterprise.exe
```

Source: https://www.reddit.com/r/VisualStudio/comments/171cncs/comment/k3px54v/

## VS 2017

Official redirects:

```
https://aka.ms/vs/15/release/vs_community.exe
https://aka.ms/vs/15/release/vs_professional.exe
https://aka.ms/vs/15/release/vs_enterprise.exe
https://aka.ms/vs/15/release/vs_buildtools.exe
```

Direct links:

```
https://download.visualstudio.microsoft.com/download/pr/90376509-0179-440a-9cb4-6f2e89f36eec/6e4b977a8e8a268cdfb592b688c3cfaf5e180d8bd638b70540de7e14d18622be/vs_Community.exe

https://download.visualstudio.microsoft.com/download/pr/90376509-0179-440a-9cb4-6f2e89f36eec/ef1de6c2573e97b1db6e7512d975d6a161c6deab0374b402eb08c776c708730c/vs_Professional.exe

https://download.visualstudio.microsoft.com/download/pr/90376509-0179-440a-9cb4-6f2e89f36eec/fd996042328ee4d363c28ac4eda32c1c478f503e6fe21c120001ddf34afb0b07/vs_Enterprise.exe
```

## VS 2017 Express

Installer, official redirect:

```
http://aka.ms/vs/15/release/vs_WDExpress.exe
```

Installer, direct link:

```
https://download.visualstudio.microsoft.com/download/pr/1d268fee-04e5-4da9-be1e-b8c9d1896c17/321e991fe41f1daea0369067023bbba0ea446cf45612f2c6a62a2f7c15dcb669/vs_WDExpress.exe
```

Create installation folder:

```
vs_WDExpress.exe --layout vs2017expr --add Microsoft.VisualStudio.Workload.WDExpress --includeRecommended --lang en-US
```

Use installation files:

```
vs_WDExpress.exe --add Microsoft.VisualStudio.Workload.WDExpress --includeRecommended
```

Source: https://stackoverflow.com/a/41802140


## VS 2015

Community, Update 3:

```
https://go.microsoft.com/fwlink/?LinkId=615448
https://download.microsoft.com/download/b/e/d/bedddfc4-55f4-4748-90a8-ffe38a40e89f/vs2015.3.com_enu.iso
```

Professional, Update 3:

```
https://go.microsoft.com/fwlink/?LinkId=615434
https://download.microsoft.com/download/e/b/c/ebc2c43f-3821-4a0b-82b1-d05368af1604/vs2015.3.pro_enu.iso
```

Ultimate, Update 3:

```
https://go.microsoft.com/fwlink/?LinkId=615436
https://download.microsoft.com/download/8/4/3/843ec655-1b67-46c3-a7a4-10a1159cfa84/vs2015.3.ent_enu.iso
```

Build tools:

```
https://download.microsoft.com/download/5/F/7/5F7ACAEB-8363-451F-9425-68A90F98B238/visualcppbuildtools_full.exe
```

Update 3 only:

```
https://go.microsoft.com/fwlink/?LinkId=708984
https://download.microsoft.com/download/c/2/6/c26892d8-6a5d-4871-9d46-629f4d430146/vs2015.3.vsu.iso
```

Team Foundation server:

```
https://go.microsoft.com/fwlink/?LinkId=615438
https://download.microsoft.com/download/5/8/4/584d316c-2b69-4297-ae5c-a9196ec6a209/tfsserver2015.3_enu.iso
```

Sources:
* https://stackoverflow.com/a/40068343
* https://xinyustudio.wordpress.com/2016/06/29/visual-studio-2015-update-3-offline-installation-iso-download-link/
* Some of localizations of VS 2015 Update 3: https://linmartintw.blogspot.com/2017/06/download-visual-studio-community-2015.html
* VS 2015 Update 2: https://gist.github.com/wang-bin/09e8182ae78e6d727721a02fe541150e

## VS 2015 Original release (without updates)

Community:

```
http://download.microsoft.com/download/0/B/C/0BC321A4-013F-479C-84E6-4A2F90B11269/vs2015.com_enu.iso
http://download.microsoft.com/download/0/B/C/0BC321A4-013F-479C-84E6-4A2F90B11269/vs_community.exe
```

Professional:

```
http://download.microsoft.com/download/5/8/9/589A8843-BA4D-4E63-BCB2-B2380E5556FD/vs2015.pro_enu.iso
http://download.microsoft.com/download/5/8/9/589A8843-BA4D-4E63-BCB2-B2380E5556FD/vs_professional.exe
```

Enterprise:
```
http://download.microsoft.com/download/6/4/7/647EC5B1-68BE-445E-B137-916A0AE51304/vs2015.ent_enu.iso
http://download.microsoft.com/download/6/4/7/647EC5B1-68BE-445E-B137-916A0AE51304/vs_enterprise.exe
```

## VS 2015 Express

Installer file:

```
http://go.microsoft.com/fwlink/?LinkId=615464

https://download.microsoft.com/download/E/8/9/E89E0AA3-EBC8-46DD-823B-9CECD1F95051/wdexpress_full_ENU.exe
```

Older version:

```
https://download.microsoft.com/download/0/3/1/031400f8-28dc-4508-9f09-a4abc0a7b81e/enu_vsu_launcher/1033_wdexpress_full_payload/wdexpress_full.exe
```

## VS 2013

Community, Update 5:

```
https://download.microsoft.com/download/A/A/D/AAD1AA11-FF9A-4B3C-8601-054E89260B78/vs2013.5_ce_enu.iso
```

Professional, Update 5:

```
https://go.microsoft.com/fwlink/?LinkId=532507&type=ISO&clcid=0x409
https://download.microsoft.com/download/F/2/E/F2EFF589-F7D7-478E-B3AB-15F412DA7DEB/vs2013.5_pro_enu.iso
```

Premium, Update 5:

```
https://go.microsoft.com/fwlink/?LinkId=532510&type=ISO&clcid=0x409
https://download.microsoft.com/download/6/5/F/65F510B7-D597-4E80-8EFE-86DDCFCC7C43/vs2013.5_prem_enu.iso
```

Ultimate, Update 5:

```
https://go.microsoft.com/fwlink/?LinkId=532504&type=ISO&clcid=0x409
https://download.microsoft.com/download/E/2/A/E2ADF1BE-8FA0-4436-A260-8780444C8355/vs2013.5_ult_enu.iso
```

Team Foundation, Update 5:

```
https://go.microsoft.com/fwlink/?LinkId=532492&type=ISO&clcid=0x409
https://download.microsoft.com/download/9/3/A/93AC3284-B5F2-43FE-BB9E-E6D0CC543A32/vs2013.5_tfs_enu.iso
```

Full, Update 5:

```
http://download.microsoft.com/download/A/F/9/AF95E6F8-2E6E-49D0-A48A-8E918D7FD768/vs2013.5.iso
```

Links:
* https://superuser.com/a/840305/1860262
* https://nickdu.com/?p=604
* https://github.com/sous-chefs/visualstudio/blob/main/attributes/vs2013.rb

## VS 2013 RTM (Original release, without updates)

Professional, Premium and Ultimate RTM:
```
http://go.microsoft.com/fwlink/?LinkId=320673
https://download.microsoft.com/download/A/F/1/AF128362-A6A8-4DB3-A39A-C348086472CC/VS2013_RTM_PRO_ENU.iso

http://download.microsoft.com/download/D/B/D/DBDEE6BB-AF28-4C76-A5F8-710F610615F7/VS2013_RTM_PREM_ENU.iso

http://download.microsoft.com/download/C/F/B/CFBB5FF1-0B27-42E0-8141-E4D6DA0B8B13/VS2013_RTM_ULT_ENU.iso
```

## VS 2013 Express

Desktop (standard Windows), Update 5:

```
http://download.microsoft.com/download/2/E/E/2EEC68E6-7B03-437A-AF06-F8E43F04014D/vs2013.5_dskexp_ENU.iso
```

Windows 8 (Metro), Update 5:

```
http://download.microsoft.com/download/E/D/8/ED8AA9A9-3077-472B-B23A-3537EEB7296E/vs2013.5_winexp_ret_ENU.iso
```

Web, Update 5:

```
http://download.microsoft.com/download/1/4/E/14EBBE1A-A30F-4A50-8A42-40A9DC095533/vs2013.5_webexp_ENU.iso
```

Desktop, (standard Windows) Update 3:

```
https://download.microsoft.com/download/2/5/5/255DCCB6-F364-4ED8-9758-EF0734CA86B8/vs2013.3_dskexp_ENU.iso
```

Installer file:

```
http://download.microsoft.com/download/7/2/E/72E0F986-D247-4289-B9DC-C4FB07374894/wdexpress_full.exe
```

Source: https://www.hanselman.com/blog/DownloadVisualStudioExpress.aspx

## VS 2012

Full, Update 5:

```
https://download.microsoft.com/download/1/7/A/17A8493D-BB25-4811-8242-CCCB74EF982E/VS2012.5.iso
https://download.microsoft.com/download/1/7/A/17A8493D-BB25-4811-8242-CCCB74EF982E/VS2012.5.exe
```

Professional, Premium and Ultimate:

```
https://download.microsoft.com/download/D/E/8/DE8E42D8-7598-4F4E-93D4-BB011094E2F9/VS2012_PRO_enu.iso
https://download.microsoft.com/download/1/3/1/131D8A8C-95D8-41D4-892A-1DF6E3C5DF7D/VS2012_PREM_enu.iso
https://download.microsoft.com/download/d/b/0/db03922c-ff91-4845-b7f2-fc68595ab730/vs2012_ult_enu.iso
```

Test Professional:

```
http://download.microsoft.com/download/7/9/7/7971903e-34e0-460c-9b38-84e8c1d0f3c3/vs2012_testpro_enu.iso
```

Team Fundation Server:

```
http://download.microsoft.com/download/a/c/f/acfefce0-9bc1-4f8c-80b8-06a0929ed926/vs2012_tfs_enu.iso
```

Full, Update 3:

```
http://download.microsoft.com/download/D/4/8/D48D1AC2-A297-4C9E-A9D0-A218E6609F06/VS2012.3.iso
http://download.microsoft.com/download/D/4/8/D48D1AC2-A297-4C9E-A9D0-A218E6609F06/VS2012.3.exe
```

## VS 2012 Express

Desktop, (standard Windows):

```
https://download.microsoft.com/download/1/F/5/1F519CC5-0B90-4EA3-8159-33BFB97EF4D9/VS2012_WDX_ENU.iso
```

Windows 8 (Metro):

```
http://download.microsoft.com/download/6/e/c/6ec5b3cf-cc0d-448a-9846-8af059de7f72/vs2012_winexp_enu.iso
```

## VS 2010

SP1

```
https://web.archive.org/web/20160401071422if_/http://download.microsoft.com/download/E/B/A/EBA0A152-F426-47E6-9E3F-EFB686E3CA20/VS2010SP1dvd1.iso
```

Professional Trial

```
https://web.archive.org/web/20160114125200if_/http://download.microsoft.com/download/4/0/E/40EFE5F6-C7A5-48F7-8402-F3497FABF888/X16-42555VS2010ProTrial1.iso
```

Premium Trial

```
https://web.archive.org/web/20130127205340if_/http://download.microsoft.com/download/F/F/8/FF8C8AF1-D520-4027-A844-8EC7BC0FB27C/X16-42546VS2010PremTrial1.iso
```

Ultimate Trial

```
https://web.archive.org/web/20160125055742if_/http://download.microsoft.com/download/2/4/7/24733615-AA11-42E9-8883-E28CDCA88ED5/X16-42552VS2010UltimTrial1.iso
```

## VS 2010 Express

```
https://web.archive.org/web/20140424044344if_/http://download.microsoft.com/download/1/E/5/1E5F1C0A-0D5B-426A-A603-1798B951DDAE/VS2010Express1.iso
```

## VS 2008

Professional 90-day trial

```
https://download.microsoft.com/download/0/4/3/0434418f-7f3d-4dd6-9846-13f75353ff80/VS2008ProEdition90DayTrialESNX1435990.iso

https://download.microsoft.com/download/8/1/d/81d3f35e-fa03-485b-953b-ff952e402520/VS2008ProEdition90dayTrialENUX1435622.iso
```

Team Suite

```
http://download.microsoft.com/download/d/8/9/d89c9839-ac45-4a6c-b25f-2f60b190e356/VS2008TeamSuiteENU90DayTrialX1429235.iso
```

Service Pack 1

```
https://www.microsoft.com/en-in/download/details.aspx?id=13276
https://download.microsoft.com/download/a/3/7/a371b6d1-fc5e-44f7-914c-cb452b4043a9/VS2008SP1ENUX1512962.iso
```

MSDN Library (SP1):

```
http://download.microsoft.com/download/1/f/0/1f07c259-7ff2-4902-9205-ad1dfb87ccab/VS2008SP1MSDNENUX1506188.iso
```

## VS 2008 Express

With SP1:

```
http://download.microsoft.com/download/e/8/e/e8eeb394-7f42-4963-a2d8-29559b738298/VS2008ExpressWithSP1ENUX1504728.iso
```

Original release:

```
https://download.microsoft.com/download/8/B/5/8B5804AD-4990-40D0-A6AA-CE894CBBB3DC/VS2008ExpressENUX1397868.iso
```

## VS 2005 Express

```
https://download.microsoft.com/download/A/9/1/A91D6B2B-A798-47DF-9C7E-A97854B7DD18/VC.iso
https://download.microsoft.com/download/D/9/C/D9C35F20-A749-4E25-A306-DE20B93AB8C0/VB.iso
https://download.microsoft.com/download/C/6/F/C6F4733B-67C7-4C15-9F21-61F7A3167505/VCS.iso
```

Sources:
* https://stackoverflow.com/a/5692990
* https://apdubey.blogspot.com/2009/04/microsoft-visual-studio-2005-express.html
* https://www.blitzbasic.org/forum/topic.php?id=216


## Documentation

### VS 2013 MSDN

```
http://www.microsoft.com/en-us/download/details.aspx?id=34794
```

### VS 2012 MSDN

```
http://download.microsoft.com/download/8/9/2/8928585D-136D-4528-AECC-2F211902A8D7/VS2012Documentation.iso
```

### VS 2008 MSDN

```
http://download.microsoft.com/download/1/f/0/1f07c259-7ff2-4902-9205-ad1dfb87ccab/VS2008SP1MSDNENUX1506188.iso
```

## Other links

* https://www.ryadel.com/en/visual-studio-2019-vs2017-vs2015-vs2013-vs2012-older-download-iso-offline-installer/
* https://forums.mydigitallife.net/threads/visual-studio-2012-rtm-direct-link-ms.36192/
* https://www.mydigitallife.net/download-visual-studio-2010-official-iso-direct-download-links-and-price-lists/
* https://gist.github.com/Mr-Precise/9967e3fcf03f2df0282b76841d2f3876
* https://github.com/sous-chefs/visualstudio/blob/main/attributes
* VS 2013 and 2015 Korean versions: https://blog.naver.com/hanbt01/220432757931
* https://findthebroken.blogspot.com/2013/12/visual-studio-2008-express-edition-with.html
* https://garyblogtest1.blogspot.com/2013/06/vs-visual-studio-2010-2012.html
* https://www.ryadel.com/en/visual-studio-2019-vs2017-vs2015-vs2013-vs2012-older-download-iso-offline-installer/
* https://www.junian.net/dev/visual-studio-downloads/#download-visual-studio-2015-with-update-3