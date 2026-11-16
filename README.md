# ICar

تطبيق صيانة العربية لأندرويد وآيفون، بالعربي ومعمول للسوق المصري.

## المميزات
- **قراءة الرخصة:** تصوّر رخصة التسيير فيطلع الماركة والموديل والسنة والسي سي واللون. أرقام الشاسيه والموتور واللوحة مش بتتطلب ولا بتتحفظ.
- **مواعيد الصيانة:** فيها 24 بند، وكل بند معاده بالكيلو أو بالوقت أيهما أقرب، على جدول "الاستخدام الشاق". فيه كمان بنود خاصة بفتيس الروبوت (Easytronic/SensoDrive).
- **إشعارات على الموبايل:** قبل كل بند بأسبوع ويوم المعاد نفسه، وقبل تجديد الرخصة بشهر وبأسبوع. الإشعارات محلية على الجهاز ومش محتاجة سيرفر.
- **سجل الصيانة:** التاريخ والعداد واللي اتغير والتكلفة والمكان، ومعاه إجمالي المصاريف.
- **الأعطال:** لمبات التابلوه، أكواد OBD، وتشخيص العَرَض بالذكاء الاصطناعي.
- **قطع الغيار:** الرقم الأصلي والبدائل، وصور القطع، وأقرب محلات قطع غيار وميكانيكي على الخريطة.
- **سعر السوق:** تقدير لسعر العربية، وروابط تقارنه بإعلانات هتلاقي وكونتكت كارز ودوبيزل.

## التقنيات
- Expo SDK 58 (React Native) مع TypeScript، وتصميم RTL.
- البيانات محفوظة على الجهاز بـ AsyncStorage.
- الإشعارات بـ expo-notifications.
- الذكاء الاصطناعي: Supabase Edge Function اسمها `supabase/functions/icar-ai`، بتكلم Claude API. مفتاح الـ API موجود على السيرفر بس، مش جوه التطبيق.

## التشغيل
```bash
npm install
cp .env.example .env   # حط بيانات Supabase
npx expo start
```
جرّب على موبايلك بتطبيق **Expo Go**، أو اعمل development build: `npx eas-cli@latest build --profile development`.

## سيرفر الذكاء الاصطناعي
```bash
supabase functions deploy icar-ai --no-verify-jwt
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# اختياري: موديل أرخص للتشغيل الكبير
supabase secrets set ICAR_MODEL=claude-haiku-5-5
```

## النشر على المتاجر
```bash
npx eas-cli@latest build --platform android --profile production   # ملف AAB لجوجل بلاي
npx eas-cli@latest build --platform ios --profile production       # لآب ستور، ومش محتاج ماك
npx eas-cli@latest submit
```
هتحتاج:
- حساب Google Play Developer، رسومه 25 دولار مرة واحدة.
- حساب Apple Developer، اشتراكه 99 دولار في السنة.
- سياسة خصوصية منشورة على لينك.
