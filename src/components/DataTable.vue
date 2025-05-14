<template>
    <div :class="options.class.data__table__wrapper" ref="tableRef">
        <div :class="options.class.data__table__search" v-if="searchable.length == 0">
            <div class="col-md-3">
                <input type="text" placeholder="Buscar.." v-model.trim="text"  @keyup="search" :class="options.class.data__table__input">
            </div>
        </div>
        <div class="table-responsive">
            <table :class="options.class.data__table">
                <thead class="thead-custom">
                    <tr class="fw-semibold fs-6 text-gray-800 border-bottom border-gray-200" style="vertical-align: middle;">
                        <th 
                            v-for="(header, index) in getHeaders()" :key="index" 
                            :style="{ 'border-top-left-radius': index == 0 ? '5px' : '0px', 'border-top-right-radius': index == getHeaders().length - 1 ? '5px' : '0px' }"
                        >
                            <div @click.prevent="handlerHeaderClick(header)" class="d-flex justify-content-center align-items-center" style="cursor: pointer;">
                                <span class="m-2 fw-bold">{{ getDeplayHeaderName(header) }}</span>
                                <template v-if="isSortable(header.label)">
                                    <div v-if="isSortBy(header.label)">
                                        <SortUp v-if="findSortBy(header.label)?.order == 'ASC'" />
                                        <SortDown  v-else/>
                                    </div>
                                    <div v-else >
                                        <Sort />
                                    </div>
                                </template>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td v-if="count == 0" :colspan="getHeaders().length" class="text-center">
                            <slot name="empty">
                                <p>No se encontraron resultados</p>
                            </slot>
                        </td>
                    </tr>
                    <tr v-for="(row, i) in currentPageRows" :key="i" class="text-center align-middle" style="vertical-align: middle;">
                        <td v-for="(header, index) in getHeaders()" :key="index" class="p-3">
                            <slot :name="header.label" :row="row">
                                {{ getDataCell(row, header) }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
    
            </table>
        </div>
        <!-- Paginación -->
        <nav>
            <ul :class="options.class.data__table__pagination">
                <li :class="options.class.data__table__page_item" @click.prevent="previous()">
                    <a :class="options.class.data__table__page_link" href="#" aria-label="Previous">
                        <ChevronLeft />
                    </a>
                </li>
                <li v-for="pageNum in visiblePages()" :key="pageNum" @click.prevent="currentPage(pageNum)" 
                    :class="[options.class.data__table__page_item, { 'active': page === pageNum }]">
                    <a :class="options.class.data__table__page_link" href="#">{{ pageNum }}</a>
                </li>
                <li :class="options.class.data__table__page_item" @click.prevent="next()">
                    <a :class="options.class.data__table__page_link" href="#" aria-label="Next">
                        <ChevronRight />
                    </a>
                </li>
            </ul>
            <div class="p-2" v-if="count > 0">
                Mostrando del {{ (page - 1) * options.limit + 1 }} A {{ page * options.limit > count ? count : page * options.limit }}
                de {{ count }} Registrosss    
            </div>
        </nav>
    </div>
</template>

<script lang="ts" setup >
import { ref, onMounted, PropType } from 'vue';
import type { THeaderTable, TSortBy, Params, TParamsRequest } from '../types/table';
import SortUp from './icons/SortUp.vue';
import SortDown from './icons/SortDown.vue';
import Sort from './icons/Sort.vue';
import ChevronLeft from './icons/ChevronLeft.vue';
import ChevronRight from './icons/ChevronRight.vue';

export * from '../types/table'

const {headers, url, sortable, searchable, options, apiHeaders, filter, requestFuntion } = defineProps({
    headers: {
        type: Array as () => THeaderTable[],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    sortable: {
        type: Array as () => string[],
        default: () => []
    },
    searchable: {
        type: Array as () => string[],
        default: () => []
    },
    apiHeaders: {
        type: Object as () => Record<string, string>,
        default: () => ({'Content-Type': 'application/json'})
    },
    options: {
        type: Object as () => {
            limit: number,
            maxVisiblePages: number,
            class: {
                data__table__wrapper: string,
                data__table: string,
                data__table__search: string,
                data__table__input: string,
                data__table__pagination: string,
                data__table__page_link: string,
                data__table__page_item: string,
                data__table__page_link_selected: string,
            },
        },
        default: () => ({
            limit: 10,
            maxVisiblePages: 10,
            class: {
                data__table__wrapper: '',
                data__table: 'table table-sm table-rounded border gy-2 gs-2 table-hover',
                data__table__search: 'row mb-3',
                data__table__input: 'form-control py-2',
                data__table__pagination: 'pagination pagination-circle pagination-outline justify-content-start',
                data__table__page_link: 'page-link',
                data__table__page_item: 'page-item',
                data__table__page_link_selected: 'active',
            },
        })
    },
    filter: {
        type: Object as () => object,
        default: () => ({})
    },
    requestFuntion: {
        type: Function as PropType<(params: TParamsRequest, paramApiHeaders: Record<string, string>) => Promise<any>>,
        default: async ({url, page, filter, limit, query, searchBy, sortBy}: TParamsRequest, paramApiHeaders: Record<string, string>) => {
            const paramsUri = {
                page,
                limit,
                ...filter,
                sortBy: sortBy ?? [],
                query: query ? encodeURIComponent(query) : null,
                ...searchBy
            } as Params;
            
            for (const key in paramsUri) {
                const element = (paramsUri as Record<string, any>)[key];
                if (element) {
                    let newValue = element;
                    if (Array.isArray(element)) {
                        newValue = JSON.stringify(element);
                    } else if (typeof element === 'object') {
                        newValue = JSON.stringify(element);
                    } else {
                        newValue = encodeURIComponent(element);
                    }
                    (paramsUri as Record<string, any>)[key] = newValue
                }else {
                    delete (paramsUri as Record<string, any>)[key]
                }
            }
            const queryString = new URLSearchParams(paramsUri as unknown as Record<string, string>).toString();
            
            const response = await fetch(`${url}?${queryString}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...paramApiHeaders,
                },
            });
            const data = await response.json();
            return data;
        }
    },
});

const emits = defineEmits(["newRows", "headerClick"]);

const text = ref<string>('');
const newRows = ref([]);
const currentPageRows = ref([]);
const page = ref<number>(1);
const count = ref<number>(0);
const sortBy = ref<TSortBy[]>([]);
const searchBy = ref();
const timeout = ref<ReturnType<typeof setTimeout>>();

onMounted(() => {
    refresh()
    if (searchable.length > 0){
        searchBy.value = {
            ...(typeof searchable[0] === 'object' && searchable[0] !== null ? searchable[0] : {}),
        }
    }
});

const totalPages = () => {
    return Math.ceil(count.value / options.limit);
}
const visiblePages = () => {
    const half = Math.floor(options.maxVisiblePages / 2);
    let start = Math.max(page.value - half, 1);
    let end = Math.min(start + options.maxVisiblePages - 1, totalPages());

    if (end - start + 1 < options.maxVisiblePages) {
        start = Math.max(end - options.maxVisiblePages + 1, 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
}
const handlerSelectOptionSearchable = (newSearchBy: any) => {
    if (newSearchBy) {
        searchBy.value = {
            ...newSearchBy
        }
    }
}
const search = () => {
    clearTimeout(timeout.value);
    timeout.value = setTimeout(() => {
        searchBy.value = {...searchBy.value, value: text.value}
        refresh()
    }, 1000);
}
const currentPage = (newPage: number) => {
    let limit = options.limit
    let offset = limit * (newPage - 1)
    currentPageRows.value = newRows.value
    page.value = newPage
    refresh()
}
const capitalizarFirstLeter = (str: string) => {
    return str
}
const next = () => {
    if (page.value + 1 > calculatePages().length) {
        return
    }
    page.value = page.value + 1
    currentPage(page.value)
}
const previous = () => {
    if (page.value <= 1) {
        return
    }
    page.value = page.value - 1
    currentPage(page.value)
}
const refresh = async () =>{
    try {
        let resp = await requestFuntion({
            url, 
            page: page.value, 
            filter, 
            limit: options.limit, 
            query: text.value, 
            searchBy: searchBy.value, 
            sortBy: sortBy.value
        }, apiHeaders)
        
        newRows.value = resp.data.data
        emits("newRows",newRows.value)
        currentPageRows.value = newRows.value
        count.value = resp.data.count
    } catch (error) {

    }
}
const handlerHeaderClick = (newHeader: THeaderTable) => {
    if (isSortable(newHeader.label)) {
        if (sortBy.value.length > 0) {
            let index = sortBy.value.findIndex(item => item.column == newHeader.label)
            if (index != -1) {
                sortBy.value[index].order = sortBy.value[index].order == 'ASC' ? 'DESC' : 'ASC'
            } else {
                sortBy.value.push({ column: newHeader.label, order: "ASC" })
            }
        } else {
            sortBy.value.push({ column: newHeader.label, order: "ASC" })
        }
        refresh()
        emits('headerClick', newHeader)
    }
}
const isSortable = (label: string) => {
    return sortable.some(item => item == label)
}
const isSortBy = (label: string) => {
    return sortBy.value.some(item => item.column == label)
}
const findSortBy = (label: string) => {
    return sortBy.value.find(item => item.column == label)
}
const getHeaders = () => {
    return headers ? headers : [{ label: "id", displayName: "ID" }]
}

const getDeplayHeaderName = (header: THeaderTable) => {
    return capitalizarFirstLeter(header.displayName ? header.displayName : header.label)
}

const getDataCell = (row: any, header: THeaderTable) => {
    let lebel = header.label
    let labels = lebel.split('.')
    if (labels.length > 1) {
        let value = row
        for (let i = 0; i < labels.length; i++) {
            if (!value[labels[i]]) {
                return
            }
            value = value[labels[i]] 
        }
        return value
    }            
    return row[header.label]
}

const calculatePages = () => {
    return Array.from({length: Math.ceil(count.value / options.limit)}, (_, i) => i) 
}
</script>

<style lang="scss">
    .data__table__input {
        height: calc(1.6em + 0.75rem + 2px);
        padding: 0.375rem 0.75rem;
        font-size: 0.9rem;
        font-weight: 400;
        line-height: 1.6;
        background-clip: padding-box;
        border: 1px solid;
        color: #212529;
        background-color: #fff;
        border-color: #ced4da;
        border-radius: 0.25rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }

    .thead-custom {
        background-color: var(--bs-primary);
    }
    
    .vs__dropdown-toggle {
        padding: 4px !important;
    }

    .page-link.active{
        z-index: 0 !important;
    }
    .active > .page-link {
        z-index: 0 !important;
    }
    * {
        --vs-colors--lightest: rgba(60, 60, 60, 0.26);
        --vs-colors--light: rgba(60, 60, 60, 0.5);
        --vs-colors--dark: #333;
        --vs-colors--darkest: rgba(0, 0, 0, 0.15);

        /* Search Input */
        --vs-search-input-color: inherit;
        --vs-search-input-bg: rgb(255, 255, 255);
        --vs-search-input-placeholder-color: inherit;

        /* Font */
        --vs-font-size: 1rem;
        --vs-line-height: 28.6px;

        /* Disabled State */
        --vs-state-disabled-bg: rgb(248, 248, 248);
        --vs-state-disabled-color: var(--vs-colors--light);
        --vs-state-disabled-controls-color: var(--vs-colors--light);
        --vs-state-disabled-cursor: not-allowed;

        /* Borders */
        --vs-border-color: var(--vs-colors--lightest);
        --vs-border-width: 1px;
        --vs-border-style: solid;
        --vs-border-radius: 4px;

        /* Actions: house the component controls */
        --vs-actions-padding: 4px 6px 0 3px;

        /* Component Controls: Clear, Open Indicator */
        --vs-controls-color: var(--vs-colors--light);
        --vs-controls-size: 1;
        --vs-controls--deselect-text-shadow: 0 1px 0 #fff;

        /* Selected */
        --vs-selected-bg: #f0f0f0;
        --vs-selected-color: var(--vs-colors--dark);
        --vs-selected-border-color: var(--vs-border-color);
        --vs-selected-border-style: var(--vs-border-style);
        --vs-selected-border-width: var(--vs-border-width);

        /* Dropdown */
        --vs-dropdown-bg: #fff;
        --vs-dropdown-color: inherit;
        --vs-dropdown-z-index: 9999;
        --vs-dropdown-min-width: 160px;
        --vs-dropdown-max-height: 800px;
        --vs-dropdown-box-shadow: 0px 3px 6px 0px var(--vs-colors--darkest);

        /* Options */
        --vs-dropdown-option-bg: #000;
        --vs-dropdown-option-color: var(--vs-dropdown-color);
        // --vs-dropdown-option-padding: 3px 20px;

        /* Active State */
        --vs-dropdown-option--active-bg: #5897fb;
        --vs-dropdown-option--active-color: #fff;

        /* Deselect State */
        --vs-dropdown-option--deselect-bg: #fb5858;
        --vs-dropdown-option--deselect-color: #fff;

        /* Transitions */
        --vs-transition-timing-function: cubic-bezier(1, -0.115, 0.975, 0.855);
        --vs-transition-duration: 150ms;

        .vs__dropdown-toggle {
            padding: 4px !important;
        }

        .page-link.active{
            z-index: 0 !important;
        }
        .active > .page-link {
            z-index: 0 !important;
        }
    }


</style>../types/table