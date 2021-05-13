import { AnyAbility, subject } from "@casl/ability";
import { Id, Service } from "@feathersjs/feathers";
import { throwUnlessCan } from "../hooks/authorize/authorize.hook.utils";
import { UtilCheckCanOptions } from "../types";
import getFieldsForConditions from "./getFieldsForConditions";

const makeOptions = (
  providedOptions: Partial<UtilCheckCanOptions>
): UtilCheckCanOptions => {
  const defaultOptions: UtilCheckCanOptions = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    actionOnForbidden: () => {},
    checkGeneral: true,
    skipThrow: false,
    useConditionalSelect: true
  };
  return Object.assign(defaultOptions, providedOptions || {});
};

const checkCan = async <S>(
  ability: AnyAbility,
  id: Id,
  method: string,
  modelName: string,
  service: Service<S>,
  providedOptions?: Partial<UtilCheckCanOptions>
): Promise<boolean> => {
  const options = makeOptions(providedOptions);
  if (options.checkGeneral) {
    const can = throwUnlessCan(
      ability,
      method,
      modelName,
      modelName,
      options
    );
    if (!can) { return false; }
  }
  
  let params;
  if (options.useConditionalSelect) {
    const $select = getFieldsForConditions(ability, method, modelName);
    params = {
      query: { $select }
    };
  }
  
  const item = await service._get(id, params);
    
  const can = throwUnlessCan(
    ability,
    method,
    subject(modelName, item),
    modelName,
    options
  );
  return can;
};

export default checkCan;