import type { FormConditionOperator, FormField } from "@/lib/types";

function normalized(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string") return value.trim().toLowerCase();
  return "";
}

function hasAnswer(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true;
  return normalized(value) !== "";
}

export function answerMatchesCondition(
  answer: unknown,
  operator: FormConditionOperator,
  expected: string | null,
) {
  if (operator === "not_empty") return hasAnswer(answer);
  if (!hasAnswer(answer)) return false;
  const expectedValue = normalized(expected);
  if (!expectedValue) return false;
  const values = Array.isArray(answer) ? answer : [answer];
  const equals = values.some((value) => normalized(value) === expectedValue);
  if (operator === "equals") return equals;
  if (operator === "not_equals") return !equals;
  return values.some((value) => normalized(value).includes(expectedValue));
}

export function isFormFieldVisible(
  field: FormField,
  fields: FormField[],
  answers: Record<string, unknown>,
  visited = new Set<string>(),
): boolean {
  if (visited.has(field.id)) return false;
  if (field.condition_field_id && field.condition_operator) {
    const source = fields.find(
      (candidate) => candidate.id === field.condition_field_id,
    );
    if (!source) return true;
    const nextVisited = new Set(visited).add(field.id);
    if (!isFormFieldVisible(source, fields, answers, nextVisited)) return false;
    return answerMatchesCondition(
      answers[source.field_key],
      field.condition_operator,
      field.condition_value,
    );
  }

  if (!field.show_if_previous_yes) return true;
  const index = fields.findIndex((candidate) => candidate.id === field.id);
  const previousField = fields
    .slice(0, index)
    .reverse()
    .find((candidate) => candidate.type !== "section");
  return (
    !previousField ||
    answerMatchesCondition(answers[previousField.field_key], "equals", "Yes")
  );
}
