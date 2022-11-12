
import axios from "axios";
import { SearchResult, Term, TermPos } from "../types";


 const wikidataClient = axios.create({
    baseURL: 'https://www.wikidata.org/w/api.php',
    headers: {
        'User-Agent': 'https://github.com/EgorDm/BOLDER'
    }
  });


export const fetchSearchTerms = async (
    query: string,
    pos: TermPos,
    limit: number = 100,
    offset: number = 0,
    timeout: number = 5000
): Promise<SearchResult<Term>> => {

    const type = pos === 'PREDICATE' ? 'property' : 'item';

    const result = await wikidataClient.get('', {
        params: {
            'action': 'wbsearchentities',
            'search': query ? query : ' ',
            'language': 'en',
            'uselang': 'en',
            'type': type,
            'format': 'json',
            'formatversion': 2,
            'errorformat': 'plaintext',
            'limit': limit,
            'continue': offset,
            'origin': '*',
        },
        timeout: timeout,
    });

    if (result.status !== 200) {
        return {
            count: 0,
            hits: [],
            error: result.statusText,
        };
    }

    const data = result.data;
    return {
        count: data['search-continue'] ? 99999 : offset + data.search.length,
        hits: data.search.map((hit: any) => {
            return {
                score: 1,
                document: parseDoc(hit, pos),
            }
        })
    }
}

const parseDoc = (doc: any, pos: TermPos): Term => {
    let iri = doc.concepturi;
    if (pos === 'PREDICATE') {
        iri = `http://www.wikidata.org/prop/direct/${doc.id}`;
    }

    return {
        type: 'uri',
        value: iri,
        pos,
        rdf_type: null,
        label: doc.label,
        description: doc.description,
        count: doc.count,
        search_text: doc.label,
        lang: null,
        range: null,
    }
}

const sparqlClient = axios.create({
    baseURL: 'https://query.wikidata.org/sparql',
    headers: {
        // 'User-Agent': 'https://github.com/EgorDm/BOLDER',
        // 'Content-Type': 'application/sparql-query',
    }
  });



export const fetchRunQuery = async (
    query: string,
    timeout: number = 5000
): Promise<any> => {
    const accept = isGraphQuery(query) ? 'application/n-triples' : 'application/sparql-results+json';

    const result = await sparqlClient.get('', {
        params: {
            timeout,
            query: query,
        },
        timeout: timeout,
        headers: {
            'Accept': accept,
        },
        responseType: 'text',
    });

    if (result.status !== 200) {
        throw new Error(result.statusText);
    }

    return {
        [accept]: isGraphQuery(query) && typeof result.data !== 'string' ? JSON.stringify(result.data) : result.data,
    }
}

const isGraphQuery = (query: string): boolean => {
    return query.toLowerCase().includes('construct') || query.toLowerCase().includes('describe');
}