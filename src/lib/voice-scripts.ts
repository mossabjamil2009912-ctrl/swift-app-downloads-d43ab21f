// رسالة صوتية واحدة مدروسة لكل شاشة: تعريف + ماذا يفعل + ماذا يكتب.
// الخيارات الفعلية تُضاف تلقائياً من الشاشة نفسها (بدون أرقام أو تنقل).
import type { Lang } from "@/lib/i18n";

export type Script = { ar: string; en: string; zh: string; input?: boolean };

export const WELCOME: Record<Lang, string> = {
  ar: "أَهْلًا بِكَ فِي نِظَامِ أَكْتِسْ لِأَنْظِمَةِ الطَّاقَةِ وَحُلُولِهَا. تَفَضَّلْ بِاخْتِيَارِ الخِدْمَةِ الَّتِي تُرِيدُهَا.",
  en: "Welcome to the ACTES system for energy systems and solutions. Please choose the service you want.",
  zh: "欢迎使用ACTES系统，专注能源系统与解决方案。请选择您想要的服务。",
};

const S = (ar: string, en: string, zh: string, input = false): Script => ({ ar, en, zh, input });

export const SCRIPTS: Record<string, Script> = {
  // ===== القوائم =====
  quote_menu: S("طَلَبُ عَرْضِ سِعْر. حَدِّدْ نَوْعَ طَلَبِكَ.", "Price quote. Choose the type of your request.", "申请报价。请选择您的请求类型。"),
  energy_menu: S("حُلُولُ أَنْظِمَةِ الطَّاقَة. يُمْكِنُكَ طَلَبُ دِرَاسَةٍ فَنِّيَّة، أَوِ التَّوَاصُلُ مَعَ فَرِيقِ أَكْتِسْ.", "Energy solutions. Explore the available solutions and choose the one that suits you.", "能源系统方案。了解可用方案，选择适合您的方案。"),
  menu_sys3: S("حَدِّدْ نَوْعَ نِظَامِ المَشْرُوع: النِّظَامُ السَّكَنِيّ، النِّظَامُ التِّجَارِيّ، النِّظَامُ الصِّنَاعِيّ، النِّظَامُ الزِّرَاعِيّ.", "Choose your project system type: the residential system, the commercial system, the industrial system, or the agricultural system.", "请确定项目的系统类型：住宅系统、商业系统、工业系统、农业系统。"),
  main_menu: S("حَدِّدْ نَوْعَ نِظَامِ المَشْرُوع: النِّظَامُ السَّكَنِيّ، النِّظَامُ التِّجَارِيّ، النِّظَامُ الصِّنَاعِيّ، النِّظَامُ الزِّرَاعِيّ.", "Choose your project system type: the residential system, the commercial system, the industrial system, or the agricultural system.", "请确定项目的系统类型：住宅系统、商业系统、工业系统、农业系统。"),


  // ===== السكني =====
  res_bill: S("المَنْظُومَةُ السَّكَنِيَّة. أَدْخِلْ مُتَوَسِّطَ فَاتُورَتِكَ الشَّهْرِيَّةِ بِالرِّيَالِ اليَمَنِيّ، أَوْ تَصَفَّحِ المَنْظُومَاتِ الجَاهِزَة.", "Residential system. Enter your average monthly bill in Yemeni riyals, or browse the ready systems.", "住宅系统。请输入月均账单金额（也门里亚尔），或浏览现成系统。", true),
  res_bill_retry: S("يُرْجَى إِدْخَالُ مَبْلَغِ الفَاتُورَةِ بِالأَرْقَامِ فَقَط، أَوْ تَصَفُّحُ المَنْظُومَاتِ الجَاهِزَة.", "Please enter the bill amount in numbers only, or browse the ready systems.", "请仅用数字输入账单金额，或浏览现成系统。", true),
  res_value: S("قِيمَةُ الاسْتِهْلَاك. اكْتُبْ قِيمَةَ اسْتِهْلَاكِكَ الشَّهْرِيِّ.", "Consumption value. Type your monthly consumption.", "用电量。请输入您的月用电量。", true),
  res_tie: S("تَمَّ إِيجَادُ خِيَارَيْنِ لِاسْتِهْلَاكِك: مَنْظُومَةٌ بِتَكْلِفَةٍ اقْتِصَادِيَّة، أَوْ مَنْظُومَةٌ بِسِعَةِ تَخْزِينٍ أَعْلَى.", "Two options fit your consumption: a more economical system, or one with higher storage capacity.", "为您找到两个方案：更经济的一套，或储能容量更高的一套。"),
  res_browse: S("حَدِّدِ القُدْرَةَ التَّخْزِينِيَّةَ وَالقُدْرَةَ الإِنْتَاجِيَّةَ المُنَاسِبَةَ مَعَ إِنْفِرْتَر {kw} كِيلُو وَاط.", "Choose the storage capacity and production capacity that suit a {kw} kilowatt inverter.", "请选择与{kw}千瓦逆变器匹配的储能容量和发电容量。"),
  res_browse_inv: S("حَدِّدْ قُدْرَةَ الإِنْفِرْتَرِ المَطْلُوبَة.", "Choose the inverter capacity you need.", "请选择所需的逆变器容量。"),
  res_quote_ask: S("هَذِهِ هِيَ المَنْظُومَةُ المُقْتَرَحَةُ لَكَ بِنَاءً عَلَى احْتِيَاجِك. يُمْكِنُكَ الاطِّلَاعُ عَلَى مُكَوِّنَاتِ المَنْظُومَةِ وَقُدْرَتِهَا وَإِنْتَاجِيَّتِهَا، وَيُمْكِنُكَ طَلَبُ عَرْضِ سِعْرٍ رَسْمِيٍّ لِلْمَنْظُومَة.", "This is the system proposed for you based on your needs. You can review the system components, capacity and production, and you can request an official quote for the system.", "这是根据您的需求为您建议的系统。您可以查看系统组件、容量和发电量，并可申请该系统的正式报价。"),
  res_quote_ask_browse: S("هَذِهِ هِيَ المَنْظُومَةُ المُقْتَرَحَةُ لَكَ بِنَاءً عَلَى احْتِيَاجِك. يُمْكِنُكَ الاطِّلَاعُ عَلَى مُكَوِّنَاتِ المَنْظُومَةِ وَقُدْرَتِهَا وَإِنْتَاجِيَّتِهَا، وَيُمْكِنُكَ طَلَبُ عَرْضِ سِعْرٍ لِلْمَنْظُومَةِ السَّكَنِيَّةِ الَّتِي اخْتَرْتَهَا.", "This is the system proposed for you based on your needs. You can review the system components, capacity and production, and you can request a quote for the residential system you chose.", "这是根据您的需求为您建议的系统。您可以查看系统组件、容量和发电量，并可为您所选的住宅系统申请报价。"),

  res_to_com: S("اسْتِهْلَاكُكَ يَتَجَاوَزُ القُدْرَةَ السَّكَنِيَّةَ المُعْتَادَة. سَنَعْرِضُ لَكَ المَنْظُومَاتِ التِّجَارِيَّةَ الأَنْسَبَ لِمُنْشَأَتِك.", "Your consumption exceeds the usual residential capacity. We will show you the commercial systems better suited to your facility.", "您的用电量超出常规住宅容量。我们将为您展示更适合的商业系统。"),
  menu_res_com: S("نَوْعُ المَنْظُومَة. حَدِّدْ نَوْعَ المَكَانِ الَّذِي تُرِيدُ تَرْكِيبَ المَنْظُومَةِ فِيه.", "System type. Choose where the system will be installed.", "系统类型。请选择安装场所。"),
  menu_ind_agr: S("نَوْعُ المَنْظُومَة. حَدِّدْ نَوْعَ المَكَانِ الَّذِي تُرِيدُ تَرْكِيبَ المَنْظُومَةِ فِيه.", "System type. Choose where the system will be installed.", "系统类型。请选择安装场所。"),

  // ===== التجاري =====
  com_method: S("اخْتَرْ طَرِيقَةَ تَحْدِيدِ الاسْتِهْلَاك.", "Choose how to define consumption.", "请选择确定用电量的方式。"),
  com_value: S("أَدْخِلْ قِيمَةَ الاسْتِهْلَاكِ الشَّهْرِيِّ لِمُنْشَأَتِك.", "Enter your facility's monthly consumption value.", "请输入场所的月度用电量数值。", true),
  com_value_bill: S("أَدْخِلْ مُتَوَسِّطَ الفَاتُورَةِ الشَّهْرِيَّةِ لِمُنْشَأَتِكَ بِالرِّيَالِ اليَمَنِيّ.", "Enter your facility's average monthly bill in Yemeni riyals.", "请输入场所的月均电费金额（也门里亚尔）。", true),
  com_value_kwh: S("أَدْخِلِ اسْتِهْلَاكَ المُنْشَأَةِ الشَّهْرِيَّ بِالكِيلُووَاط.", "Enter your facility's monthly consumption in kilowatts.", "请输入场所每月的用电量（千瓦）。", true),
  com_value_diesel: S("أَدْخِلِ اسْتِهْلَاكَ الدِّيزِلِ الشَّهْرِيَّ بِاللِّتْرِ لِمُنْشَأَتِك.", "Enter your facility's monthly diesel consumption in liters.", "请输入场所每月的柴油消耗量（升）。", true),
  com_value_retry: S("أَدْخِلِ القِيمَةَ بِالأَرْقَامِ فَقَط، وَتَأَكَّدْ مِنْ صِحَّةِ الرَّقَمِ المُدْخَل.", "Enter the value in numbers only, and make sure the amount is correct.", "请仅用数字输入数值，并确认金额正确。", true),
  com_phase_ask: S("حَدِّدْ نَوْعَ كَهْرَبَاءِ المُنْشَأَة: سِنْجِلْ فِيز، أَوْ ثْرِي فِيز.", "Choose the facility's power type: single phase, or three phase.", "请选择设施的供电类型：单相或三相。"),
  com_inv_ask: S("اخْتَرْ قُدْرَةَ الإِنْفِرْتَرِ المُنَاسِبَةَ لِمُنْشَأَتِك.", "Choose the inverter capacity that suits your facility.", "请选择适合您场所的逆变器功率。"),
  com_quote_ask: S("حُدِّدَتِ المَنْظُومَةُ المُنَاسِبَةُ لِمُنْشَأَتِك. رَاجِعِ المُلَخَّص، وَيُمْكِنُكَ مُتَابَعَةُ الشِّرَاءِ أَوْ طَلَبُ دِرَاسَةٍ فَنِّيَّة.", "The right system for your facility has been selected. Review the summary, then continue to purchase or request a technical study.", "已为您的场所选定合适系统。请查看摘要，可继续购买或申请技术研究。"),
  com_visit_done: S("تَمَّ تَسْجِيلُ مَوْعِدِ الزِّيَارَةِ المَيْدَانِيَّةِ بِنَجَاح. سَيَتَوَاصَلُ مَعَكَ فَرِيقُ أَكْتِسْ لِتَأْكِيدِ المَوْعِدِ وَالمُعَايَنَة، وَيُمْكِنُكَ طَلَبُ دِرَاسَةِ مُحَاكَاةِ الطَّاقَةِ لِمُنْشَأَتِك.", "Your site visit has been registered. The ACTES team will contact you to confirm the appointment and survey, and you can request an energy simulation study for your facility.", "现场勘查已登记。ACTES团队将与您确认时间并进行勘查，您也可为场所申请发电量模拟研究。"),
  com_out_of_range: S("احْتِيَاجُ مُنْشَأَتِكَ يَتَجَاوَزُ المَنْظُومَاتِ التِّجَارِيَّةَ الجَاهِزَة. سَيَتَوَاصَلُ مَعَكَ الفَرِيقُ الهَنْدَسِيُّ لِإِعْدَادِ تَصْمِيمٍ خَاصٍّ بِمَشْرُوعِك.", "Your facility's needs exceed our ready commercial systems. The engineering team will contact you to prepare a custom design for your project.", "您的用电需求超出现成商业系统范围。工程团队将与您联系，为项目定制设计方案。"),
  com_visit_ask: S("هَذِهِ المَنْظُومَةُ التِّجَارِيَّةُ المُقْتَرَحَةُ لِمُنْشَأَتِك. يُمْكِنُكَ إِصْدَارُ عَرْضِ سِعْرٍ رَسْمِيّ، أَوْ حَجْزُ مَوْعِدٍ لِزِيَارَةٍ مَيْدَانِيَّةٍ إِلَى مَوْقِعِ المُنْشَأَة.", "This is the proposed commercial system for your facility. You can issue an official quote, or book an on-site visit to the facility.", "这是为您的场所建议的商业系统。您可出具正式报价，或预约到现场进行实地勘查。"),
  com_visit_facility: S("أَدْخِلِ اسْمَ المُنْشَأَةِ أَوْ نَوْعَ النَّشَاطِ التِّجَارِيِّ لِتَوْثِيقِ طَلَبِ المُعَايَنَةِ المَيْدَانِيَّة.", "Enter the facility name or business activity so we can register your on-site survey request.", "请输入企业名称或经营类型，以登记您的现场勘查申请。", true),
  com_visit_location_gov: S("حَدِّدِ المَوْقِعَ لِتَرْتِيبِ زِيَارَةِ الفَرِيقِ الهَنْدَسِيّ.", "Select the location so we can arrange the engineering team's visit.", "请选择地点，以安排工程团队的到访。"),
  com_visit_date: S("حَدِّدِ اليَوْمَ وَالوَقْتَ المُنَاسِبَيْنِ لِزِيَارَةِ فَرِيقِنَا الهَنْدَسِيِّ لِمُنْشَأَتِك.", "Choose the day and time that suit you for our engineering team's visit to your facility.", "请确定我们工程团队上门勘查的日期和时间。", true),
  com_quote_name: S("أَدْخِلِ اسْمَ المُنْشَأَةِ أَوِ المَسْؤُولِ الَّذِي سَيُعْتَمَدُ فِي عَرْضِ السِّعْرِ الرَّسْمِيّ.", "Enter the facility or contact name to be used on the official quote.", "请输入正式报价单上采用的企业名称或负责人姓名。", true),

  // ===== الصناعي =====
  ind_name: S("المَنْظُومَةُ الصِّنَاعِيَّة. اكْتُبِ اسْمَ المَصْنَعِ أَوِ الجِهَة.", "Industrial system. Type the factory or company name.", "工业系统。请输入工厂或单位名称。", true),
  ind_activity: S("حَدِّدْ نَشَاطَ مَصْنَعِكَ الصِّنَاعِيّ، لِتَصْمِيمِ مَنْظُومَةٍ تُنَاسِبُ طَبِيعَةَ الإِنْتَاج.", "Choose your factory's industrial activity, so the system fits your production.", "请选择工厂的工业类型，以便按生产性质设计系统。"),
  ind_loc_gov: S("حَدِّدِ المَوْقِعَ لِتَرْتِيبِ إِجْرَاءَاتِ التَّوْرِيدِ وَالتَّرْكِيب.", "Select the location so we can arrange supply and installation.", "请选择地点，以安排供货与安装。"),
  ind_shifts: S("حَدِّدْ عَدَدَ وَرْدِيَّاتِ التَّشْغِيلِ اليَوْمِيَّة، لِحِسَابِ سِعَةِ البَطَّارِيَّاتِ اللَّازِمَةِ لِلْعَمَلِ اللَّيْلِيّ.", "Choose the number of daily shifts, so we can size the batteries for night operation.", "请选择每天的班次数，以计算夜间运行所需的电池容量。"),
  ind_shift: S("وَقْتُ الوَرْدِيَّة. اكْتُبْ وَقْتَ بِدَايَةِ الوَرْدِيَّةِ وَنِهَايَتِهَا.", "Shift time. Type the shift start and end time.", "班次时间。请输入班次开始和结束时间。", true),
  ind_shift_retry: S("يُرْجَى كِتَابَةُ وَقْتِ البِدَايَةِ وَالنِّهَايَةِ بِالأَرْقَام، مِثْلَ ثَمَانِيَةٍ صَبَاحاً إِلَى أَرْبَعَةٍ عَصْراً.", "Please type the start and end time in numbers, for example eight in the morning to four in the afternoon.", "请用数字输入开始和结束时间，例如上午八点到下午四点。", true),
  ind_kw_retry: S("يُرْجَى إِدْخَالُ القُدْرَةِ بِالأَرْقَامِ فَقَط، مَحْسُوبَةً بِالكِيلُووَاط.", "Please enter the power in numbers only, in kilowatts.", "请仅用数字输入功率，单位为千瓦。", true),
  ind_out_of_range: S("مَشْرُوعُكَ يَتَطَلَّبُ حُلُولاً صِنَاعِيَّةً مُتَقَدِّمَةً وَتَصْمِيماً هَنْدَسِيّاً خَاصّاً. تَمَّ تَحْوِيلُ المِلَفِّ إِلَى فَرِيقِ مُهَنْدِسِي أَنْظِمَةِ الطَّاقَةِ لِلتَّوَاصُلِ مَعَكَ مُبَاشَرَة.", "Your project needs advanced industrial solutions and a dedicated engineering design. Your file has been sent to our energy systems engineers, who will contact you directly.", "您的项目需要先进的工业方案和专门的工程设计。资料已转交能源系统工程团队，他们将直接与您联系。"),
  ind_load_src: S("اخْتَرْ كَيْفِيَّةَ تَقْدِيمِ بَيَانَاتِ الأَحْمَال: رَفْعُ جَدْوَلٍ هَنْدَسِيّ، أَوْ إِدْخَالُ القُدْرَةِ يَدَوِيّاً.", "Choose how to provide the load data: upload an engineering sheet, or enter the capacity manually.", "请选择负载数据的提交方式：上传工程表格，或手动输入容量。"),
  ind_load_file: S("إِرْفَاقُ جَدْوَلِ الأَحْمَالِ أَوْ صُوَرِ اللَّوْحَاتِ يُتِيحُ لِلْفَرِيقِ الهَنْدَسِيِّ تَدْقِيقَ التَّصْمِيمِ لَك، أَوْ تَخَطَّ هَذِهِ الخُطْوَة.", "Attaching the load schedule or panel photos lets our engineering team verify the design for you, or skip this step.", "附上负载清单或配电柜照片，可让工程团队为您核对设计，也可跳过此步。", true),
  ind_total_kw: S("القُدْرَةُ الكُلِّيَّة. أَدْخِلْ إِجْمَالِيَّ قُدْرَةِ المَصْنَعِ بِالكِيلُووَاط.", "Total power. Enter the factory's total power in kilowatts.", "总功率。请以千瓦输入工厂总功率。", true),
  ind_max_mach: S("أَكْبَرُ آلَة. اكْتُبْ قُدْرَةَ أَكْبَرِ آلَةٍ فِي المَصْنَع.", "Largest machine. Type the power of the largest machine.", "最大设备。请输入最大设备的功率。", true),
  ind_motors: S("هَلْ تَعْمَلُ فِي المَصْنَعِ مُحَرِّكَاتٌ ضَخْمَةٌ أَوْ خُطُوطُ إِنْتَاجٍ ذَاتُ تَيَّارِ إِقْلَاعٍ عَالٍ؟ هَذَا يُحَدِّدُ سِعَةَ الإِنْفِرْتَرَاتِ اللَّازِمَةِ لِبَدْءِ التَّشْغِيلِ بِأَمَان.", "Does the factory run heavy motors or production lines with high starting current? This determines the inverter capacity needed for a safe start.", "工厂是否有大型电机或启动电流高的生产线？这决定了安全启动所需的逆变器容量。"),
  ind_motor_kw: S("قُدْرَةُ المُحَرِّك. اكْتُبْ قُدْرَةَ المُحَرِّكِ بِالكِيلُووَاط.", "Motor power. Type the motor power in kilowatts.", "电机功率。请以千瓦输入电机功率。", true),
  ind_source: S("حَدِّدْ مَصْدَرَ التَّغْذِيَةِ الحَالِيَّ لِمَصْنَعِك: مُوَلِّدَاتُ دِيزِل، شَبَكَةٌ عَامَّة، أَوْ نِظَامٌ مُشْتَرَك.", "Select your factory's current power source: diesel generators, public grid, or a mixed setup.", "请选择工厂当前的供电来源：柴油发电机、公共电网，或混合方式。"),
  ind_gen_kva: S("أَدْخِلْ قُدْرَةَ مُوَلِّدِ المَصْنَع، أَوْ تَخَطَّ الخُطْوَةَ إِذَا كُنْتَ لَا تَعْرِفْهَا.", "Enter the factory generator capacity, or skip this step if you don't know it.", "请输入工厂发电机容量，若不清楚可跳过此步。", true),
  ind_diesel: S("أَدْخِلِ اسْتِهْلَاكَ الدِّيزِلِ اليَوْمِيَّ بِاللِّتْر، لِحِسَابِ مِقْدَارِ الوَفْرِ المَالِيِّ لِمَصْنَعِك.", "Enter the daily diesel consumption in liters, to calculate your factory's financial savings.", "请输入每日柴油消耗量（升），以计算工厂的节省金额。", true),
  ind_goal: S("حَدِّدِ الهَدَفَ الأَسَاسِيَّ: خَفْضُ تَكَالِيفِ الدِّيزِل، أَوْ تَشْغِيلٌ مُسْتَمِرٌّ عَلَى مَدَارِ السَّاعَة.", "Choose the main goal: cutting diesel costs, or continuous round-the-clock operation.", "请确定主要目标：降低柴油成本，或实现二十四小时不间断运行。"),
  ind_old_pv: S("أَدْخِلْ قُدْرَةَ مَنْظُومَتِكَ القَائِمَةِ بِالكِيلُووَاط، أَوْ تَخَطَّ هَذِهِ الخُطْوَة.", "Enter your existing system capacity in kilowatts, or skip this step.", "请输入现有系统容量（千瓦），或跳过此步骤。", true),
  ind_result: S("اكْتَمَلَ التَّصْمِيمُ الأَوَّلِيُّ لِمَنْظُومَةِ مَصْنَعِك. رَاجِعِ المُوَاصَفَاتِ الهَنْدَسِيَّةَ أَمَامَك، وَيُمْكِنُكَ إِصْدَارُ عَرْضِ السِّعْرِ الرَّسْمِيّ، أَوْ طَلَبُ دِرَاسَةِ مُحَاكَاةِ الإِنْتَاجِيَّةِ السَّنَوِيَّة، أَوِ المُخَطَّطِ التَّنْفِيذِيِّ لِلْمَنْظُومَة.", "The initial design of your factory system is complete. Review the engineering specifications shown, then issue the official quote, request the annual energy-yield simulation study, or the execution diagram.", "工厂系统初步设计已完成。请查看屏幕上的工程规格，可出具正式报价、申请年发电量模拟研究，或索取施工图。"),
  ind_quote_ask: S("المَنْظُومَةُ الصِّنَاعِيَّةُ جَاهِزَة. هَلْ تُرِيدُ إِصْدَارَ عَرْضِ سِعْرٍ رَسْمِيٍّ لِمَصْنَعِك؟", "The industrial system is ready. Would you like an official quote for your factory?", "工业系统已准备好。是否为您的工厂出具正式报价？"),

  // ===== الزراعي =====
  agr_bill: S("اكْتُبْ تَكْلِفَةَ الدِّيزِلِ أَوِ الكَهْرَبَاءِ الشَّهْرِيَّةِ لِمَزْرَعَتِك.", "Type your farm's monthly diesel or electricity cost.", "请输入农场每月的柴油或电费支出。", true),
  agr_pump_type: S("المَسَارُ الزِّرَاعِيّ. حَدِّدْ طَبِيعَةَ الضَّخِّ أَوِ الرَّيِّ فِي مَزْرَعَتِكَ مِنَ القَائِمَة، لِيُنَاسِبَ التَّصْمِيمُ مَصْدَرَ المِيَاه.", "Agricultural path. Choose your farm's pumping or irrigation type from the list, so the design matches your water source.", "农业路径。请从列表中选择农场的抽水或灌溉类型，使设计匹配水源。"),
  agr_pump_power: S("أَدْخِلْ قُدْرَةَ الغَاطِسِ أَوِ المَضَخَّةِ بِالحِصَان. إِنْ لَمْ تَكُنْ تَعْرِفُهَا، فَاخْتَرْ لَا أَعْرِف، وَيُقَدِّرُهَا الفَرِيقُ الهَنْدَسِيُّ بَعْدَ المُعَايَنَة.", "Enter the pump power in horsepower. If you do not know it, choose I don't know and the engineering team will estimate it.", "请输入水泵功率（马力）。若不清楚，请选择不知道，工程团队将进行估算。", true),
  agr_well_depth: S("أَدْخِلْ عُمْقَ تَنْزِيلِ الغَاطِسِ أَوِ ارْتِفَاعَ الضَّخِّ بِالمِتْر، فَهُوَ يُحَدِّدُ الضَّغْطَ المَطْلُوبَ وَحَجْمَ المَنْظُومَة.", "Enter the pump setting depth or pumping head in meters; it determines the required pressure and system size.", "请输入水泵下放深度或扬程（米），它决定所需压力与系统规模。", true),
  agr_hours: S("كَمْ سَاعَةً تَحْتَاجُ تَشْغِيلَ الضَّخِّ يَوْمِيّاً؟ المَنْظُومَةُ تَعْمَلُ بِالضَّخِّ المُبَاشِرِ نَهَاراً، وَهُوَ الأَوْفَرُ لِأَنَّهُ بِلَا بَطَّارِيَّات.", "How many hours do you need to pump each day? The system pumps directly during daylight, which is the most economical option since it needs no batteries.", "每天需要抽水多少小时？系统在白天直接抽水，无需电池，最为经济。", true),
  agr_pumps: S("كَمْ عَدَدُ المَضَخَّاتِ الَّتِي تُرِيدُ تَشْغِيلَهَا؟ تَشْغِيلُ أَكْثَرَ مِنْ مَضَخَّةٍ يَحْتَاجُ مُرَاجَعَةَ تَيَّارِ الإِقْلَاع.", "How many pumps do you want to run? Running more than one pump requires reviewing the starting current.", "您希望同时运行多少台水泵？多台运行需核查启动电流。", true),
  agr_source: S("مَا مَصْدَرُ تَشْغِيلِ الضَّخِّ حَالِيّاً فِي مَزْرَعَتِك؟", "What currently powers the pumping on your farm?", "目前农场的抽水由什么供电？"),
  agr_diesel: S("أَدْخِلْ مُتَوَسِّطَ تَكْلِفَةِ التَّشْغِيلِ الشَّهْرِيَّة، لِنُقَدِّرَ لَكَ حَجْمَ الوَفْرِ بَعْدَ التَّحَوُّلِ لِلضَّخِّ الشَّمْسِيّ.", "Enter your average monthly running cost, so we can estimate your savings after switching to solar pumping.", "请输入每月平均运行成本，以便估算改用太阳能抽水后的节省。", true),
  agr_result: S("اكْتَمَلَ التَّصْمِيمُ الأَوَّلِيُّ لِمَنْظُومَةِ الضَّخِّ الشَّمْسِيِّ فِي مَزْرَعَتِك. رَاجِعِ المُوَاصَفَاتِ أَمَامَك، وَيُمْكِنُكَ طَلَبُ عَرْضِ السِّعْرِ الرَّسْمِيّ، أَوْ حَجْزُ مُعَايَنَةٍ مَيْدَانِيَّةٍ لِلْبِئْر.", "The initial design of your farm's solar pumping system is complete. Review the specifications shown, then request the official quote or book a site visit to the well.", "农场太阳能抽水系统初步设计已完成。请查看屏幕上的规格，可申请正式报价或预约现场勘查。"),
  agr_name: S("اكْتُبِ الاسْمَ الَّذِي يُعْتَمَدُ فِي عَرْضِ السِّعْرِ الرَّسْمِيّ.", "Type the name to be used on the official quote.", "请输入用于正式报价的名称。", true),
  agr_visit_date: S("اكْتُبِ اليَوْمَ وَالوَقْتَ المُنَاسِبَيْنِ لِمُعَايَنَةِ البِئْرِ وَالمَزْرَعَة.", "Type the day and time that suit you for the well and farm site visit.", "请输入适合勘查水井与农场的日期和时间。", true),
  agr_quote_ask: S("حُدِّدَتِ المَنْظُومَةُ المُنَاسِبَةُ لِمَزْرَعَتِك. رَاجِعِ المُلَخَّص، وَيُمْكِنُكَ مُتَابَعَةُ الشِّرَاءِ أَوْ طَلَبُ دِرَاسَةٍ فَنِّيَّة.", "The right system for your farm has been selected. Review the summary, then continue to purchase or request a technical study.", "已为您的农场选定合适系统。请查看摘要，可继续购买或申请技术研究。"),

  // ===== الأحمال والدراسة =====
  pv_loads: S("الأَحْمَالُ السَّاعِيَّة. اكْتُبِ الحِمْلَ بِالكِيلُووَات لِكُلِّ سَاعَةٍ مِنَ السَّاعَاتِ الأَرْبَعِ وَالعِشْرِين، وَاكْتُبْ صِفْراً لِلسَّاعَاتِ بِلَا أَحْمَال.", "Hourly loads. Enter the load in kilowatts for each of the 24 hours, and enter zero for hours with no load.", "小时负荷。请为24个小时中的每一小时输入负荷（千瓦），无负荷的小时请输入0。", true),
  pv_sysmode: S("مَنْظُومَةً هَجِينَةً مَعَ بَطَّارِيَّات، أَوْ مُتَّصِلَةً بِالشَّبَكَة، أَوْ مُسْتَقِلَّةً بِالكَامِل.", "A hybrid system with batteries, grid-connected, or fully off-grid.", "混合储能系统、并网系统，或完全离网系统。"),
  pv_site_gov: S("حَدِّدِ المَوْقِعَ لِتَرْتِيبِ إِجْرَاءَاتِ التَّوْرِيدِ وَالتَّرْكِيب.", "Select the location so we can arrange supply and installation.", "请选择地点，以安排供货与安装。"),
  pv_quote_ask: S("اكْتَمَلَتِ الحِسَابَاتُ الهَنْدَسِيَّةُ لِمَنْظُومَتِك. رَاجِعْ تَفَاصِيلَ القُدْرَةِ وَالمُكَوِّنَات، وَيُمْكِنُكَ إِصْدَارُ عَرْضِ سِعْرٍ رَسْمِيّ.", "The engineering calculations for your system are complete. Review the capacity and components, and you can issue an official quote.", "系统工程计算已完成。请查看容量与组件，可出具正式报价。"),
  pv_quote_name: S("اسْمُ العَمِيل. اكْتُبِ الاسْمَ الَّذِي سَيَظْهَرُ فِي عَرْضِ السِّعْر.", "Customer name. Type the name for the quote.", "客户名称。请输入报价单上的名称。", true),
  pv_study_ask: S("يُمْكِنُكَ طَلَبُ دِرَاسَةِ مُحَاكَاةِ الإِنْتَاجِيَّةِ السَّنَوِيَّةِ وَتَوْفِيرِ الطَّاقَةِ لِمَنْظُومَتِك.", "You can request an annual energy-yield and savings simulation study for your system.", "您可为系统申请年发电量与节能模拟研究。"),
  pv_sld_ask: S("المُخَطَّطُ التَّنْفِيذِيُّ يَضْمَنُ تَرْكِيبَ المَنْظُومَةِ وَلَوْحَاتِ الحِمَايَةِ بِأَعْلَى مَعَايِيرِ الأَمَان.", "The execution diagram ensures the system and protection panels are installed to the highest safety standards.", "施工图可确保系统与保护柜按最高安全标准安装。"),
  study_ask: S("يُمْكِنُكَ طَلَبُ دِرَاسَةِ مُحَاكَاةِ الإِنْتَاجِيَّةِ السَّنَوِيَّةِ وَتَوْفِيرِ الطَّاقَة.", "You can request an annual energy-yield and savings simulation study.", "您可申请年发电量与节能模拟研究。"),
  study_city_gov: S("حَدِّدِ المَوْقِعَ لِاعْتِمَادِ بَيَانَاتِ الإِشْعَاعِ الشَّمْسِيِّ فِي الدِّرَاسَة.", "Select the location so the study uses the right solar data.", "请选择地点，以采用相应的太阳辐射数据。"),
  study_city_sld_gov: S("حَدِّدِ المَوْقِعَ لِتَرْتِيبِ إِجْرَاءَاتِ التَّوْرِيدِ وَالتَّرْكِيب.", "Select the location so we can arrange supply and installation.", "请选择地点，以安排供货与安装。"),
  sld_ask: S("المُخَطَّطُ الكَهْرَبَائِيُّ التَّنْفِيذِيُّ يَضْمَنُ تَرْكِيبَ المَنْظُومَةِ بِأَعْلَى مَعَايِيرِ الأَمَان.", "The electrical execution diagram ensures the system is installed to the highest safety standards.", "电气施工图可确保系统按最高安全标准安装。"),
  quote_name: S("أَدْخِلِ الاسْمَ المُرَادَ اعْتِمَادُهُ فِي عَرْضِ السِّعْر، أَوْ ثَبِّتِ اسْمَكَ الحَالِيّ.", "Enter the name to be used on the quote, or keep your current name.", "请输入要用于报价单的名称，或保留当前名称。", true),
  qnext_ask: S("عَرْضُ السِّعْرِ جَاهِزٌ أَمَامَك. يُمْكِنُكَ طَلَبُ دِرَاسَةٍ فَنِّيَّة، أَوْ مُخَطَّطٍ هَنْدَسِيّ، أَوْ مُتَابَعَةُ الشِّرَاء.", "Your quote is ready. You can request a technical study, an engineering diagram, or continue with the purchase.", "报价已就绪。可申请技术研究、工程图纸，或继续购买。"),

  // ===== الشراء =====
  buy_ask: S("عَرْضُ السِّعْرِ الرَّسْمِيُّ جَاهِزٌ، بِمُوَاصَفَاتِهِ وَضَمَانِه. يُمْكِنُكَ مُتَابَعَةُ الشِّرَاءِ أَوِ التَّوَاصُلُ مَعَ المَبِيعَات.", "Your official quote is ready, with its specifications and warranty. You can continue the purchase or contact sales.", "正式报价已准备好，包含规格与质保。您可以继续购买或联系销售。"),
  buy_location_gov: S("حَدِّدِ المَوْقِعَ لِتَرْتِيبِ إِجْرَاءَاتِ التَّوْرِيدِ وَالتَّرْكِيب.", "Select the location so we can arrange supply and installation.", "请选择地点，以安排供货与安装。"),
  loc_dist: S("حَدِّدِ المِنْطَقَةَ بِدِقَّةٍ لِتَسْهِيلِ وُصُولِ فَرِيقِ التَّرْكِيب.", "Select the exact area so the installation team can reach you easily.", "请准确选择区域，方便安装团队抵达。"),
  item_menu: S("طَلَبُ صِنْف مُحَدَّد. حَدِّدْ قِسْمَ المُنْتَجِ الَّذِي تُرِيدُه.", "Specific item request. Choose the product section you need.", "指定产品。请选择您需要的产品类别。"),
  item_pick: S("اخْتَرِ الصِّنْفَ المَطْلُوب.", "Choose the item you need.", "请选择所需产品。"),
  item_pick_pv: S("اخْتَرْ قُدْرَةَ اللَّوْحِ المَطْلُوبَ مِنَ القَائِمَة.", "Choose the panel capacity you need from the list.", "请从列表中选择所需的组件功率。"),
  item_pick_inv: S("اخْتَرْ نَوْعَ الإِنْفِرْتَرِ المَطْلُوبَ مِنَ القَائِمَة.", "Choose the inverter you need from the list.", "请从列表中选择所需的逆变器。"),
  item_pick_bat: S("اخْتَرْ نَوْعَ البَطَّارِيَّةِ المَطْلُوبَةَ مِنَ القَائِمَة.", "Choose the battery you need from the list.", "请从列表中选择所需的电池。"),
  item_pick_acc: S("اخْتَرْ نَوْعَ الكَابِلِ أَوِ اللَّوْحَةِ مِنَ القَائِمَة.", "Choose the cable or board from the list.", "请从列表中选择电缆或配电箱。"),
  item_pick_ess: S("اخْتَرِ الكَبِينَةَ أَوِ الرَّاكَ المَطْلُوبَ مِنَ القَائِمَة.", "Choose the cabinet or rack you need from the list.", "请从列表中选择所需的机柜或电池架。"),
  item_pick_saf: S("اخْتَرْ صِنْفَ السَّلَامَةِ أَوِ التَّأْرِيضِ مِنَ القَائِمَة.", "Choose the safety or earthing item from the list.", "请从列表中选择安全或接地产品。"),
  item_name: S("أَدْخِلِ الاسْمَ المُرَادَ اعْتِمَادُهُ فِي عَرْضِ السِّعْر، أَوْ ثَبِّتِ اسْمَكَ الحَالِيّ.", "Enter the name for the quote, or confirm your current name.", "请输入报价单上使用的名称，或确认当前名称。", true),
  item_qty: S("اكْتُبِ الكَمِّيَّةَ الَّتِي تُرِيدُهَا.", "Enter the quantity you want.", "请输入您想要的数量。", true),
  item_qty_m: S("أَدْخِلِ الطُّولَ المَطْلُوبَ بِالمِتْر.", "Enter the required length in meters.", "请输入所需长度（米）。", true),
  item_next: S("تَمَّتِ الإِضَافَةُ لِلسَّلَّةِ بِنَجَاح. يُمْكِنُكَ إِضَافَةُ صِنْفٍ آخَرَ أَوْ طَلَبُ عَرْضِ السِّعْر.", "Added to your cart. You can add another item or request the quote.", "已加入清单。您可以再添加产品或申请报价。"),
  item_cart: S("سَلَّةُ المُشْتَرَيَات. رَاجِعْ أَصْنَافَكَ ثُمَّ أَكْمِلْ طَلَبَك.", "Your cart. Review your items, then complete your order.", "购物清单。请核对产品，然后完成订单。"),

  item_pv_type: S("نَوْعُ اللَّوْح. اخْتَرْ قُدْرَةَ اللَّوْحِ الشَّمْسِيِّ المَطْلُوبَة.", "Panel type. Choose the solar panel capacity you need.", "组件类型。请选择所需的太阳能板功率。"),
  item_inv_type: S("نَوْعُ الإِنْفِرْتَر. اخْتَرْ قُدْرَةَ الإِنْفِرْتَرِ المَطْلُوبَة.", "Inverter type. Choose the inverter capacity you need.", "逆变器类型。请选择所需的逆变器容量。"),
  item_bat_type: S("نَوْعُ البَطَّارِيَّة. اخْتَرْ سَعَةَ البَطَّارِيَّةِ المَطْلُوبَة.", "Battery type. Choose the battery capacity you need.", "电池类型。请选择所需的电池容量。"),
  item_bc_kind: S("الكَابِلَاتُ وَاللَّوْحَات. حَدِّدْ مَا تُرِيدُ إِضَافَتَه.", "Cables and boards. Choose what you want to add.", "电缆与配电箱。请选择要添加的项目。"),
  item_ib_kind: S("الإِنْفِرْتَرَاتُ وَالبَطَّارِيَّات. حَدِّدْ مَا تُرِيدُ إِضَافَتَه.", "Inverters and batteries. Choose what you want to add.", "逆变器与电池。请选择要添加的项目。"),
  item_cable_type: S("نَوْعُ الكَابِل. اخْتَرْ مَقَاسَ الكَابِلِ المَطْلُوب.", "Cable type. Choose the cable size you need.", "电缆类型。请选择所需的电缆规格。"),
  item_pv_qty: S("عَدَدُ الأَلْوَاح. اكْتُبِ العَدَدَ المَطْلُوبَ.", "Panel count. Type the number you need.", "组件数量。请输入所需数量。", true),
  item_inv_qty: S("عَدَدُ الإِنْفِرْتَرَات. اكْتُبِ العَدَدَ المَطْلُوبَ.", "Inverter count. Type the number you need.", "逆变器数量。请输入所需数量。", true),
  item_bat_qty: S("عَدَدُ البَطَّارِيَّات. اكْتُبِ العَدَدَ المَطْلُوبَ.", "Battery count. Type the number you need.", "电池数量。请输入所需数量。", true),
  item_cable_len: S("طُولُ الكَابِل. اكْتُبِ الطُّولَ المَطْلُوبَ بِالمِتْرِ.", "Cable length. Type the length in meters.", "电缆长度。请输入所需米数。", true),
  item_board_amp: S("سِعَةُ اللَّوْحَة. اكْتُبِ التَّيَّارَ المَطْلُوبَ بِالأَمْبِيرِ.", "Board rating. Type the required current in amperes.", "配电箱规格。请输入所需电流（安培）。", true),
  item_board_qty: S("عَدَدُ اللَّوْحَات. اكْتُبِ العَدَدَ المَطْلُوبَ.", "Board count. Type the number you need.", "配电箱数量。请输入所需数量。", true),

  // ===== الدفع =====
  plan_pick: S("اخْتَرْ بَيْنَ دِرَاسَةِ إِنْتَاجِيَّةِ الطَّاقَة، أَوْ طَلَبِ المُخَطَّطِ التَّنْفِيذِيِّ لِلْمَنْظُومَة.", "Choose between an energy-yield study, or requesting the system's execution diagram.", "请选择发电量研究，或申请系统施工图。"),
  pay_method: S("حَدِّدْ طَرِيقَةَ التَّحْوِيلِ المُنَاسِبَة: مَحَافِظُ إِلِكْتُرُونِيَّة، أَوْ شَبَكَاتُ صِرَافَةٍ مَحَلِّيَّة.", "Choose the transfer method that suits you: e-wallets, or local exchange networks.", "请选择适合的转账方式：电子钱包，或本地汇兑网络。"),
  pay_wallet: S("المَحْفَظَةُ الإِلِكْتُرُونِيَّة. اكْتُبِ اسْمَ المَحْفَظَةِ الَّتِي سَتُحَوِّلُ عَبْرَهَا.", "Mobile wallet. Type the name of the wallet you will transfer from.", "电子钱包。请输入您转账所用钱包的名称。", true),
  pay_wallet_name: S("بَيَانَاتُ المَحْفَظَة. اكْتُبِ الاسْمَ وَالرَّقْمَ المُسَجَّلَ فِي المَحْفَظَة.", "Wallet details. Type the name and number registered on the wallet.", "钱包信息。请输入钱包登记的姓名和号码。", true),
  pay_network: S("شَبَكَةُ التَّحْوِيل. اكْتُبِ اسْمَ شَبَكَةِ الصِّرَافَةِ الَّتِي سَتُحَوِّلُ عَبْرَهَا.", "Transfer network. Type the name of the exchange network you will use.", "汇款网络。请输入您使用的汇款机构名称。", true),
  pay_network_name: S("بَيَانَاتُ المُرْسِل. اكْتُبِ اسْمَ المُرْسِلِ وَرَقْمَ هَاتِفِهِ كَمَا فِي الحَوَالَة.", "Sender details. Type the sender's name and phone number as on the transfer.", "汇款人信息。请按汇款单填写姓名和电话。", true),
  pay_notice: S("حَوِّلِ المَبْلَغَ لِلْحِسَابِ الظَّاهِرِ أَمَامَك، ثُمَّ اكْتُبْ رَقْمَ الحَوَالَةِ لِتَأْكِيدِ حَجْزِك.", "Transfer the amount to the account shown, then type the transfer number to confirm your booking.", "请将金额转入屏幕上显示的账户，然后输入汇款编号以确认预订。", true),

  // ===== الدعم والاستشارات =====
  sup_name: S("الدَّعْمُ الفَنِّيّ. نَحْنُ هُنَا لِمُسَاعَدَتِك. اكْتُبِ اسْمَك.", "Technical support. We're here to help. Type your name.", "技术支持。我们随时为您服务。请输入您的姓名。", true),
  sup_device: S("نَوْعُ الجِهَاز. اكْتُبْ نَوْعَ الجِهَازِ أَوِ النِّظَامِ الَّذِي فِيهِ المُشْكِلَة.", "Device type. Type the device or system that has the problem.", "设备类型。请输入出现问题的设备或系统。", true),
  sup_problem: S("وَصْفُ المُشْكِلَة. اكْتُبْ وَصْفًا مُخْتَصَرًا لِلْمُشْكِلَة.", "Problem description. Briefly describe the problem.", "问题描述。请简要描述问题。", true),
  sup_city_gov: S("حَدِّدْ مَوْقِعَكَ لِتَوْجِيهِ طَلَبِكَ لِفَرِيقِ الدَّعْمِ المُخْتَصّ.", "Select your location so we route your request to the right support team.", "请选择您的位置，以便将请求转给相应的支持团队。"),
  con_name: S("الاسْتِشَارَاتُ الهَنْدَسِيَّة. اكْتُبِ اسْمَكَ أَوِ اسْمَ الجِهَةِ الَّتِي تُمَثِّلُهَا.", "Engineering consulting. Type your name or your organization's name.", "工程咨询。请输入您的姓名或单位名称。", true),
  con_service: S("الاسْتِشَارَات. اكْتُبْ نَوْعَ الاسْتِشَارَةِ أَوْ خِدْمَةِ الطَّاقَةِ الَّتِي تَحْتَاجُهَا.", "Consulting. Type the consultation or energy service you need.", "咨询。请输入您需要的咨询或能源服务。", true),
  con_project: S("تَفَاصِيلُ المَشْرُوع. اكْتُبْ وَصْفًا مُخْتَصَرًا لِمَشْرُوعِك.", "Project details. Briefly describe your project.", "项目详情。请简要描述您的项目。", true),
  done: S("تَمَّ اسْتِلَامُ طَلَبِك. يُمْكِنُكَ اخْتِيَارُ خِدْمَةٍ أُخْرَى.", "Your request was received. You can choose another service.", "已收到您的请求。您可以选择其他服务。"),
  pay_notice_done: S("تَمَّ اسْتِلَامُ طَلَبِك. عِنْدَ تَأْكِيدِ فَاتُورَتِكَ سَيَصِلُكَ إِشْعَار، وَسَيَتِمُّ التَّوَاصُلُ مَعَكَ مِنْ مُوَظَّفِي إِدَارَةِ المَبِيعَاتِ فِي شَرِكَةِ أَكْتِس.", "Your request was received. When your invoice is confirmed you will get a notification, and the sales department staff at ACTES will contact you.", "已收到您的请求。发票确认后您会收到通知，ACTES销售部门的员工将与您联系。"),
};

export const OPTIONS_WORD: Record<Lang, string> = { ar: "الخِيَارَات", en: "Options", zh: "选项" };
export const MANY_OPTIONS: Record<Lang, string> = { ar: "اخْتَرْ", en: "Choose", zh: "请从列表中选择" };
