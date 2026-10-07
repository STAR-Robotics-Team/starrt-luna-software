# Sources

The robot's hardware facts and the competition rules come from these documents: the
official guidebook, the makers' datasheets and manuals, standards, and official software
documentation. **They are the source of truth.** When a number in these docs, in the
power budget, or in anyone's memory disagrees with a primary source, the source wins: fix
the doc, and cite the page.

- **Before you rely on a number, open its source.** Each entry below links straight to
  every page these docs cite.
- **Primary sources** come from whoever makes the part or sets the rule. **Secondary
  sources**, such as a reseller's product page or a retailer's chart, are marked below.
  Use one only when no primary source covers the fact, and when the two disagree, the
  primary source wins.
- **To cite a source or add one,** see [Cite sources](writing-docs.md#cite-sources).

26 sources, 23 of them primary, cited 31 times. PDF page
numbers are the ones a PDF viewer shows, so each link opens the PDF at the cited page. This
page is generated from `docs/sources.toml` by `scripts/sources render`.

## Competition rules

### `nasa-lunabotics-guidebook-2027`

NASA and the Astronauts Memorial Foundation, *NASA Lunabotics Challenge Guidebook 2026-2027* (Revised 10/5/26). [Open the PDF](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `856e20b50acb0d39`, checked 2026-10-07.
- **Used for:** Run timing, the E-stop and energy logger rules, autonomy and bandwidth scoring, and the 80 kg mass limit.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 7](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=7), [p. 40](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=40), [p. 41](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=41), [pp. 41-42](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=41), [p. 42](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=42), [p. 45](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=45), [p. 48](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=48), [p. 54](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=54), [p. 55](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=55), [pp. 55-56](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=55), [pp. 55-57](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=55), [p. 60](https://www.amfcse.org/s/Lunabotics-Guidebook-2027-10-5-27.pdf#page=60)

## Datasheets and manuals

### `andymark-775-redline-report`

AndyMark and Chiaphua, *775 RedLine Motor Performance Test Report, am-3775a (DF-30F-2003)* (Tested 5/10/2018). [Open the PDF](https://s3.amazonaws.com/docusync-files/edd416abca3a3c3d33d09a7da3e876bfe534588e878915a4b6ec049034be169c/am-3775a%20RedLine%20Performance%20Curve.PDF).

- **Primary source.**
- **Fingerprint:** SHA-256 `edd416abca3a3c3d`, checked 2026-10-07.
- **Used for:** Excavator motor data at 12 V. The page is a scan, so it has no text layer.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 1](https://s3.amazonaws.com/docusync-files/edd416abca3a3c3d33d09a7da3e876bfe534588e878915a4b6ec049034be169c/am-3775a%20RedLine%20Performance%20Curve.PDF#page=1)

### `andymark-cim-curve`

AndyMark, *2.5 in CIM motor curve, am-0255 (Chiaphua PM25R-45F-1003)* (Tested 2011/11/10). [Open the PDF](https://s3.amazonaws.com/docusync-files/9f2c14096cb651c76ea92520dce95d49694b5a25f88381e01f4df24db3c64e1e/am-0255%20CIM-motor-curve-am-0255.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `9f2c14096cb651c7`, checked 2026-10-07.
- **Used for:** Drive motor data at 12 V: free and stall current, stall torque, torque constant.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 1](https://s3.amazonaws.com/docusync-files/9f2c14096cb651c76ea92520dce95d49694b5a25f88381e01f4df24db3c64e1e/am-0255%20CIM-motor-curve-am-0255.pdf#page=1)

### `bussmann-185-datasheet`

Eaton Bussmann, hosted by AndyMark (am-0282), *Series 181, 184, 185 thermal circuit breakers* (As downloaded 2026-10-07). [Open the PDF](https://files.andymark.com/PDFs/am-0282_data_sheet.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `baba5c15ada12189`, checked 2026-10-07.
- **Used for:** Main breaker ratings and voltage.
- **Cited at:** not cited in these docs yet

### `ctre-pdp-guide`

CTRE, *PDP User's Guide* (3/28/2018). [Open the PDF](https://ctre.download/files/user-manual/PDP%20User's%20Guide.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `224b3486e9db72e8`, checked 2026-10-07.
- **Used for:** Channels, fused outputs, wire sizes, input range, CAN rate, and the termination jumper.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 6](https://ctre.download/files/user-manual/PDP%20User's%20Guide.pdf#page=6), [pp. 17-20](https://ctre.download/files/user-manual/PDP%20User's%20Guide.pdf#page=17)

### `ctre-talon-srx-guide`

CTRE, *Talon SRX User's Guide* (Updated 2017-02-03). [Open the PDF](https://ctre.download/files/user-manual/Talon%20SRX%20User's%20Guide.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `d1ca3a7c7884a8a4`, checked 2026-10-07.
- **Used for:** Input voltage range, CAN bus rate, and the data port's analog and limit switch inputs.
- **Cited at:**
    - [CAN bus](can-bus.md): [p. 5](https://ctre.download/files/user-manual/Talon%20SRX%20User's%20Guide.pdf#page=5)

### `ctre-victor-spx-guide`

CTRE, *Victor SPX User's Guide* (Updated 2021-11-29). [Open the PDF](https://ctre.download/files/user-manual/Victor%20SPX%20User's%20Guide.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `ec9ead84cb2ecf21`, checked 2026-10-07.
- **Used for:** Input voltage range and current ratings.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 3](https://ctre.download/files/user-manual/Victor%20SPX%20User's%20Guide.pdf#page=3)

### `ctre-vrm-guide`

CTRE, *VRM User's Guide* (1/17/2016). [Open the PDF](https://ctre.download/files/user-manual/VRM%20User's%20Guide.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `5b572789ccb362ad`, checked 2026-10-07.
- **Used for:** Input range, output voltages, and the 1.5 A continuous limit on the 2 A channels.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 5](https://ctre.download/files/user-manual/VRM%20User's%20Guide.pdf#page=5)

### `glideforce-lact-datasheet`

Concentric International (Glideforce), hosted by Pololu, *LACT Industrial Duty Linear Actuator datasheet* (190703). [Open the PDF](https://www.pololu.com/file/0J1901/ID-LACT-Acme-Screw-Drive-Linear-Actuator-Data-Sheet-190703.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `fa9246aa4da06289`, checked 2026-10-07.
- **Used for:** Depth actuators: current by gear ratio, duty cycle, and the part-number key.
- **Cited at:** not cited in these docs yet

### `nvidia-orin-nano-carrier-spec`

NVIDIA, *Jetson Orin Nano Developer Kit Carrier Board Specification, SP-11324-001* (v1.3). [Open the PDF](https://developer.nvidia.com/embedded/downloads).

- **Primary source.**
- **Fingerprint:** SHA-256 `4a0f7ba948bce488`, checked 2026-10-07. It cannot be downloaded automatically, so the weekly check skips it.
- **Used for:** Behind NVIDIA's login: search the Jetson Download Center for SP-11324-001. DC jack input, the J14 button header, and the J17 CAN header.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [p. 7](https://developer.nvidia.com/embedded/downloads)

### `open-mesh-om-datasheet`

Open-Mesh, hosted by a reseller, *OM-Series datasheet (OM2P, OM5P-AC)* (As downloaded 2026-10-07). [Open the PDF](https://www.open-mesh.nl/wp-content/uploads/OpenMesh-OM-Series-Datasheet.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `716b5dd2b5e6d1d8`, checked 2026-10-07.
- **Used for:** Radio power draw. Open-Mesh no longer exists, so this copy may disappear.
- **Cited at:** not cited in these docs yet

### `unitree-l2-manual`

Unitree, *Unitree 4D LiDAR L2 User Manual* (As downloaded 2026-10-07). [Open the PDF](https://oss-global-cdn.unitree.com/static/Unitree%204D%20LiDAR%20L2%20User%20Manual.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `95a3e52ce5fa1cc9`, checked 2026-10-07.
- **Used for:** Supply voltage and power, including the self-heating peak.
- **Cited at:** not cited in these docs yet

## Vendor and product pages

### `andymark-775-redline-page`

AndyMark, *775 RedLine Motor*. [Open the web page](https://www.andymark.com/products/andymark-775-redline-motor).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** Product specifications, with their plus or minus 10% tolerance.
- **Cited at:** not cited in these docs yet

### `andymark-neverest-page`

AndyMark, *NeveRest Series Motor Only*. [Open the web page](https://www.andymark.com/products/neverest-series-motor-only).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** Conveyor and hatch motor specifications.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [whole source](https://www.andymark.com/products/neverest-series-motor-only)

### `liperior-16000-4s-page`

RC Battery, *Liperior 16000mAh 4S 12C 14.8V LiPo Battery*. [Open the web page](https://rcbattery.com/liperior-16000mah-4s-12c-14-8v-lipo-battery-with-xt90-plug.html).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** Capacity, discharge ratings, and weight.
- **Cited at:** not cited in these docs yet

### `waveshare-sn65hvd230-wiki`

Waveshare, *SN65HVD230 CAN Board*. [Open the web page](https://www.waveshare.com/wiki/SN65HVD230_CAN_Board).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** The CAN transceiver NVIDIA recommends for development.
- **Cited at:** not cited in these docs yet

### `alte-wire-sizing-chart`

AltE, *Wire sizing chart for 12V, 24V, and 48V DC systems*. [Open the web page](https://www.altestore.com/pages/wire-sizing-chart-for-12v-24v-and-48v-dc-systems).

- **Secondary source.** Prefer a primary source when one covers the fact.
- **Checked:** 2026-10-07
- **Used for:** A retailer's chart of copper wire ampacity, used in the power budget. Check against the wire maker's rating for how the wire is run.
- **Cited at:** not cited in these docs yet

### `andymark-cim-page`

AndyMark, *CIM Motor 2.5 in.*. [Open the web page](https://www.andymark.com/products/2-5-in-cim-motor).

- **Secondary source.** Prefer a primary source when one covers the fact.
- **Checked:** 2026-10-07
- **Used for:** AndyMark resells this CCL motor. Its free and stall currents differ from the maker's test curve (andymark-cim-curve); use the curve.
- **Cited at:** not cited in these docs yet

### `pololu-lact18-500apl`

Pololu, *Glideforce LACT18-500APL Industrial-Duty Linear Actuator*. [Open the web page](https://www.pololu.com/product/3608).

- **Secondary source.** Prefer a primary source when one covers the fact.
- **Checked:** 2026-10-07
- **Used for:** A reseller's page, but the only published stall current and limit switch behavior; the maker's datasheet leaves them out.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [section "Using the actuator"](https://www.pololu.com/product/3608#:~:text=Using%20the%20actuator)

## Software references

### `ctre-phoenix5-motor-controllers`

CTRE, *Phoenix 5 documentation: Bring Up: Talon FX/SRX and Victor SPX*. [Open the web page](https://v5.docs.ctr-electronics.com/en/stable/ch13_MC.html).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** Current limiting (Talon SRX only) and what the Victor SPX can measure.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [section "Current Limit"](https://v5.docs.ctr-electronics.com/en/stable/ch13_MC.html#:~:text=Current%20Limit), [section "Plot tab"](https://v5.docs.ctr-electronics.com/en/stable/ch13_MC.html#:~:text=Plot%20tab)

### `ctre-phoenix5-unmanaged-api`

CTRE, *CTRE Phoenix C++: ctre::phoenix::unmanaged::Unmanaged Class Reference*. [Open the web page](https://api.ctr-electronics.com/phoenix/stable/cpp/classctre_1_1phoenix_1_1unmanaged_1_1_unmanaged.html).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** FeedEnable(timeoutMs): the controllers disable themselves when the enable is not fed again within the timeout.
- **Cited at:**
    - [Operating Modes Design](design/operating-modes.md): [section "FeedEnable()"](https://api.ctr-electronics.com/phoenix/stable/cpp/classctre_1_1phoenix_1_1unmanaged_1_1_unmanaged.html#:~:text=FeedEnable%28%29)

### `nvidia-jetson-can-r38-4`

NVIDIA, *Jetson Linux Developer Guide r38.4: Controller Area Network (CAN)*. [Open the web page](https://docs.nvidia.com/jetson/archives/r38.4/DeveloperGuide/HR/ControllerAreaNetworkCan.html).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** The Jetson's CAN controller, the transceiver it needs, and its driver. Its J17 pin table disagrees with the carrier specification.
- **Cited at:** not cited in these docs yet

### `nvidia-jetson-power-r36-5`

NVIDIA, *Jetson Linux Developer Guide r36.5: Platform Power and Performance (Orin)*. [Open the web page](https://docs.nvidia.com/jetson/archives/r36.5/DeveloperGuide/SD/PlatformPowerAndPerformance/JetsonOrinNanoSeriesJetsonOrinNxSeriesAndJetsonAgxOrinSeries.html).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** The Jetson's power modes.
- **Cited at:** not cited in these docs yet

### `ros-rep-2000`

Open Robotics, *REP 2000: ROS 2 Releases and Target Platforms*. [Open the web page](https://www.ros.org/reps/rep-2000.html).

- **Primary source.**
- **Checked:** 2026-10-07
- **Used for:** Which operating systems each ROS 2 release supports, and at which tier.
- **Cited at:**
    - [Development environment](development-environment.md): [section "Jazzy Jalisco (May 2024 - May 2029)"](https://www.ros.org/reps/rep-2000.html#:~:text=Jazzy%20Jalisco%20%28May%202024%20%2D%20May%202029%29)

## Engineering practice

### `esa-margin-philosophy`

ESA, *Margin philosophy for science assessment studies, SRE-PA/2011.097* (Issue 1 Rev 3, 15/06/2012). [Open the PDF](https://sci.esa.int/documents/34375/36249/1567260131067-Margin_philosophy_for_science_assessment_studies_1.3.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `0ddc1b0116f96b2a`, checked 2026-10-07.
- **Used for:** Power margins by design maturity, and the system margin, used in the power budget.
- **Cited at:** not cited in these docs yet

### `nasa-tm-20220012395`

NASA Glenn Research Center, *NASA/TM-20220012395: 40 kW Fission Surface Power System Deployability* (2022). [Open the PDF](https://ntrs.nasa.gov/api/citations/20220012395/downloads/TM-20220012395.pdf).

- **Primary source.**
- **Fingerprint:** SHA-256 `52d22b3e3ae7630e`, checked 2026-10-07.
- **Used for:** NASA Glenn's own 30% power growth practice. Its AIAA S-120A growth table is a reproduction; the standard itself is paywalled.
- **Cited at:** not cited in these docs yet
