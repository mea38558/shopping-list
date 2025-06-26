import OpenAI from 'openai';

interface Category {
  id: string;
  name: string;
}

const CATEGORIES: Category[] = [
  { id: '1', name: 'מוצרי ניקיון' },
  { id: '2', name: 'גבינות' },
  { id: '3', name: 'ירקות ופירות' },
  { id: '4', name: 'בשר ודגים' },
  { id: '5', name: 'מאפים' }
];

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined in the environment variables.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function checkProductCategory(productName: string, categoryId: string): Promise<boolean> {

  const category = CATEGORIES.find(cat => cat.id === categoryId);
  if (!category) {
    console.error(`שגיאה: ID קטגוריה '${categoryId}' אינו חוקי. המוצר '${productName}' לא נבדק.`);
    return false;
  }

  const categoryName = category.name;

  const prompt = `קבע באופן חד משמעי האם המוצר הנתון שייך לקטגוריה הנתונה.
השב אך ורק ב'כן' או 'לא'. אין להוסיף כל טקסט אחר, הסבר או סימן פיסוק.

דוגמאות:
מוצר: בננה, קטגוריה: ירקות ופירות -> כן
מוצר: גזר, קטגוריה: ירקות ופירות -> כן
מוצר: חלב, קטגוריה: ירקות -> לא
מוצר: לחמנייה, קטגוריה: בשר -> לא
מוצר: עגבניות, קטגוריה: ירקות ופירות -> כן
מוצר: קרואסון, קטגוריה: מאפים -> כן
מוצר: סלמון, קטגוריה: בשר ודגים -> כן
מוצר: כסא, קטגוריה: ירקות -> לא
מוצר: אקונומיקה, קטגוריה: מוצרי ניקיון -> כן
מוצר: קוטג', קטגוריה: גבינות -> כן
מוצר: עוף שלם, קטגוריה: בשר ודגים -> כן

מוצר: ${productName}, קטגוריה: ${categoryName} ->`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "אתה מסווג מוצרים לקטגוריות קניות. מטרתך הבלעדית היא להשיב 'כן' או 'לא' בלבד, ללא יוצא מן הכלל, בהתאם לשיוך המוצר לקטגוריה. דיוק ועקביות הם עליונים. אין להוסיף סימני פיסוק כלשהם." },
        { role: "user", content: prompt }
      ],
      max_tokens: 5,
      temperature: 0.0,
    });

    const rawAnswer = completion.choices[0].message.content?.trim()?.toLowerCase() || '';

    console.log(`OpenAI Raw Answer for '${productName}' in '${categoryName}': '${rawAnswer}'`);

    return rawAnswer.includes('כן');
  } catch (error) {
    console.error(`שגיאה בקריאה ל-OpenAI API עבור מוצר '${productName}' וקטגוריה '${categoryName}':`, error);
    return false;
  }
}