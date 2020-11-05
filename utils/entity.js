/**
 * Copyright 2013-2020 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const _ = require('lodash');
const pluralize = require('pluralize');
const { createFaker } = require('./faker');
const { parseLiquibaseChangelogDate } = require('./liquibase');
const { entityDefaultConfig } = require('../generators/generator-defaults');
const { stringHashCode } = require('../generators/utils');

const BASE_TEMPLATE_DATA = {
    primaryKeyType: undefined,
    primaryKeyName: undefined,
    skipUiGrouping: false,
    haveFieldWithJavadoc: false,
    existingEnum: false,
    searchEngine: false,

    fieldsContainDate: false,
    fieldsContainInstant: false,
    fieldsContainUUID: false,
    fieldsContainZonedDateTime: false,
    fieldsContainDuration: false,
    fieldsContainLocalDate: false,
    fieldsContainBigDecimal: false,
    fieldsContainBlob: false,
    fieldsContainImageBlob: false,
    fieldsContainTextBlob: false,
    fieldsContainBlobOrImage: false,
    validation: false,
    fieldsContainOwnerManyToMany: false,
    fieldsContainNoOwnerOneToOne: false,
    fieldsContainOwnerOneToOne: false,
    fieldsContainOneToMany: false,
    fieldsContainManyToOne: false,
    fieldsContainEmbedded: false,
    fieldsIsReactAvField: false,

    get otherRelationships() {
        return [];
    },

    get enums() {
        return [];
    },
    // these variable hold field and relationship names for question options during update
    get fieldNameChoices() {
        return [];
    },
    get blobFields() {
        return [];
    },
    get differentTypes() {
        return [];
    },
    get differentRelationships() {
        return [];
    },
    get i18nToLoad() {
        return [];
    },
};

function prepareEntityForTemplates(entityWithConfig, generator) {
    const entityName = entityWithConfig.name;
    _.defaults(entityWithConfig, entityDefaultConfig, BASE_TEMPLATE_DATA);

    entityWithConfig.changelogDateForRecent = parseLiquibaseChangelogDate(entityWithConfig.changelogDate);
    entityWithConfig.faker = entityWithConfig.faker || createFaker(generator.jhipsterConfig.nativeLanguage);
    entityWithConfig.resetFakerSeed = (suffix = '') =>
        entityWithConfig.faker.seed(stringHashCode(entityWithConfig.name.toLowerCase() + suffix));

    entityWithConfig.entityAngularJSSuffix = entityWithConfig.angularJSSuffix;
    if (entityWithConfig.entityAngularJSSuffix && !entityWithConfig.entityAngularJSSuffix.startsWith('-')) {
        entityWithConfig.entityAngularJSSuffix = `-${entityWithConfig.entityAngularJSSuffix}`;
    }

    entityWithConfig.useMicroserviceJson = entityWithConfig.useMicroserviceJson || entityWithConfig.microserviceName !== undefined;
    if (generator.jhipsterConfig.applicationType === 'gateway' && entityWithConfig.useMicroserviceJson) {
        if (!entityWithConfig.microserviceName) {
            throw new Error('Microservice name for the entity is not found. Entity cannot be generated!');
        }
        entityWithConfig.microserviceAppName = generator.getMicroserviceAppName(entityWithConfig.microserviceName);
        entityWithConfig.skipServer = true;
    }

    _.defaults(entityWithConfig, {
        entityNameCapitalized: _.upperFirst(entityName),
        entityClass: _.upperFirst(entityName),
        entityInstance: _.lowerFirst(entityName),
        entityTableName: generator.getTableName(entityName),
        entityNamePlural: pluralize(entityName),
    });

    _.defaults(entityWithConfig, {
        entityNamePluralizedAndSpinalCased: _.kebabCase(entityWithConfig.entityNamePlural),
        entityClassPlural: _.upperFirst(entityWithConfig.entityNamePlural),
        entityInstancePlural: _.lowerFirst(entityWithConfig.entityNamePlural),
    });

    _.defaults(entityWithConfig, {
        // Implement i18n variant ex: 'male', 'female' when applied
        entityI18nVariant: 'default',
        entityClassHumanized: _.startCase(entityWithConfig.entityNameCapitalized),
        entityClassPluralHumanized: _.startCase(entityWithConfig.entityClassPlural),
    });

    entityWithConfig.entityFileName = _.kebabCase(
        entityWithConfig.entityNameCapitalized + _.upperFirst(entityWithConfig.entityAngularJSSuffix)
    );
    entityWithConfig.entityFolderName = generator.getEntityFolderName(entityWithConfig.clientRootFolder, entityWithConfig.entityFileName);
    entityWithConfig.entityModelFileName = entityWithConfig.entityFolderName;
    entityWithConfig.entityParentPathAddition = generator.getEntityParentPathAddition(entityWithConfig.clientRootFolder);
    entityWithConfig.entityPluralFileName = entityWithConfig.entityNamePluralizedAndSpinalCased + entityWithConfig.entityAngularJSSuffix;
    entityWithConfig.entityServiceFileName = entityWithConfig.entityFileName;

    entityWithConfig.entityAngularName =
        entityWithConfig.entityClass + generator.upperFirstCamelCase(entityWithConfig.entityAngularJSSuffix);
    entityWithConfig.entityReactName = entityWithConfig.entityClass + generator.upperFirstCamelCase(entityWithConfig.entityAngularJSSuffix);

    entityWithConfig.entityApiUrl = entityWithConfig.entityNamePluralizedAndSpinalCased;
    entityWithConfig.entityStateName = _.kebabCase(entityWithConfig.entityAngularName);
    entityWithConfig.entityUrl = entityWithConfig.entityStateName;

    entityWithConfig.entityTranslationKey = entityWithConfig.clientRootFolder
        ? _.camelCase(`${entityWithConfig.clientRootFolder}-${entityWithConfig.entityInstance}`)
        : entityWithConfig.entityInstance;
    entityWithConfig.entityTranslationKeyMenu = _.camelCase(
        entityWithConfig.clientRootFolder
            ? `${entityWithConfig.clientRootFolder}-${entityWithConfig.entityStateName}`
            : entityWithConfig.entityStateName
    );

    entityWithConfig.differentTypes.push(entityWithConfig.entityClass);
    entityWithConfig.i18nToLoad.push(entityWithConfig.entityInstance);
    entityWithConfig.i18nKeyPrefix = `${entityWithConfig.frontendAppName}.${entityWithConfig.entityTranslationKey}`;

    const hasBuiltInUserField = entityWithConfig.relationships.some(relationship => generator.isBuiltInUser(relationship.otherEntityName));
    entityWithConfig.saveUserSnapshot =
        entityWithConfig.applicationType === 'microservice' &&
        entityWithConfig.authenticationType === 'oauth2' &&
        hasBuiltInUserField &&
        entityWithConfig.dto === 'no';

    entityWithConfig.fields
        .filter(field => field.options)
        .forEach(field => {
            _.defaults(field, {
                id: field.options.id,
            });
        });

    entityWithConfig.relationships
        .filter(r => r.options)
        .forEach(r => {
            // in case of OneToOne relationship a new field is added marked as id
            r.id = r.options.id && r.relationshipType === 'many-to-one';
            _.defaults(r, {
                useJPADerivedIdentifier: r.useJPADerivedIdentifier || (r.options.id && r.relationshipType === 'one-to-one' && r.ownerSide),
            });
        });

    if (!entityWithConfig.embedded) {
        generator.initIdField(entityWithConfig, entityWithConfig.databaseType);
    }

    entityWithConfig.generateFakeData = type => {
        const fieldsToGenerate = entityWithConfig.fields.filter(field => !field.autoIncrement);
        const fieldEntries = fieldsToGenerate.map(field => {
            const fieldData = field.generateFakeData(type);
            if (!field.nullable && fieldData === null) return undefined;
            return [field.fieldName, fieldData];
        });
        const withError = fieldEntries.find(entry => !entry);
        if (withError) {
            generator.warning(`Error generating a full sample for entity ${entityName}`);
            return undefined;
        }
        return Object.fromEntries(fieldEntries);
    };

    return entityWithConfig;
}

function computePrimaryKeyIfNotComputed(entityWithConfig, generator) {
    if (!entityWithConfig.primaryKey) {
        entityWithConfig.primaryKey = [
            ...entityWithConfig.fields
                .filter(f => f.id)
                .map(field => ({
                    field,
                    name: field.fieldName,
                    nameDotted: field.fieldName,
                    entity: entityWithConfig,
                    usedRelationships: [],
                    autoIncrement: field.autoIncrement,
                })),
            ...entityWithConfig.relationships
                .filter(r => r.id)
                .flatMap(relationship => {
                    const otherEntity = generator.configOptions.sharedEntities[_.upperFirst(relationship.otherEntityName)];
                    computePrimaryKeyIfNotComputed(otherEntity, generator);
                    return otherEntity.primaryKey.map(pk => {
                        return {
                            field: pk.field,
                            name: `${relationship.relationshipName}${pk.nameCapitalized}`,
                            nameDotted: `${relationship.relationshipName}.${pk.name}`,
                            entity: pk.entity,
                            usedRelationships: [relationship, ...pk.usedRelationships],
                        };
                    });
                }),
        ];
        if (entityWithConfig.primaryKey.length === 1) {
            entityWithConfig.primaryKeyType = entityWithConfig.primaryKey[0].field.fieldType;
            entityWithConfig.primaryKeyName = entityWithConfig.primaryKey[0].name;
            if (entityWithConfig.primaryKey[0].name === 'id' && entityWithConfig.primaryKeyType === 'Long') {
                entityWithConfig.primaryKey[0].field.autoIncrement = true;
                entityWithConfig.primaryKey[0].autoIncrement = true;
            }
        } else {
            entityWithConfig.primaryKeyType = `${entityWithConfig.entityClass}Id`;
            entityWithConfig.primaryKeyName = 'id';
        }
        entityWithConfig.primaryKey.forEach(pk => {
            pk.nameUnderscored = _.snakeCase(pk.name);
            pk.nameCapitalized = _.upperFirst(pk.name);
            pk.columnName = generator.getColumnName(pk.nameDotted.replace(/\./, '_'));
            pk.setter = `set${pk.nameCapitalized}`;
            pk.getter = (pk.field.fieldType === 'Boolean' ? 'is' : 'get') + pk.nameCapitalized;
        });
    }
}

/**
 * Copy required application config into entity.
 * Some entity features are related to the backend instead of the current app.
 * This allows to entities files based on the backend features.
 *
 * @param {Object} entity - entity to copy the config into.
 * @param {Object} config - config object.
 * @returns {Object} the entity parameter for chaining.
 */
function loadRequiredConfigIntoEntity(entity, config) {
    _.defaults(entity, {
        databaseType: config.databaseType,
        prodDatabaseType: config.prodDatabaseType,
        skipUiGrouping: config.skipUiGrouping,
        searchEngine: config.searchEngine,
        jhiPrefix: config.jhiPrefix,
        authenticationType: config.authenticationType,
    });
    return entity;
}

module.exports = { prepareEntityForTemplates, loadRequiredConfigIntoEntity, computePrimaryKeyIfNotComputed };
