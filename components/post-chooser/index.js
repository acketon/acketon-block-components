/**
 * Component: Post Chooser
 *
 * Displays the ten most recently published posts,
 * and an option to search.
 */

// External dependencies.
import classnames from 'classnames';
import { parse as defaultParse } from '@wordpress/block-serialization-default-parser';

// Import CSS.
import './editor.scss';

// Internal dependencies.
import PostChooserAttributes from './attributes';

// WordPress dependencies.
import { __ } from '@wordpress/i18n';

import {
	Component,
    Fragment,
    useState
} from '@wordpress/element';

import {
	Button,
	Modal,
	Panel,
	PanelBody,
	Spinner,
	TextControl,
    ToggleControl,
    RadioControl,
} from '@wordpress/components';

import { withSelect, select, useSelect } from '@wordpress/data';

// import {
// 	decodeEntities
// } from '@wordpress/htmlEntities';

import {
	withInstanceId
} from '@wordpress/compose';

import apiFetch from '@wordpress/api-fetch'

import {
	addQueryArgs
} from '@wordpress/url';


export const PostChooser = ( props ) => {

    const { 
        onSelectPost,
        label = '',
        buttonLabel = __( 'Select Post' ),
        postTypes = [ 'posts', 'pages' ], // Default post types to search.
        placeholder = '',
        minCharacters = 3,
        customEndpoint = false,
        metaQueryArgs,
        customQueryArgs,
        setAttributes,
    } = props;

    // Modal State Handlers.
    const [
        isModalOpen,
        setIsModalOpen
    ] = useState( false );

    // Search Results State.
    const [
        searchResults, 
        setSearchResults
    ] = useState( [] );

    // Search Posts for String State.
    const [
        searchString, 
        setSearchString
    ] = useState( '' );

    // Loading results from endpoint state.
    const [
        isLoading, 
        setIsLoading
    ] = useState( false );

    // Selected Post state.
    const [
        selectedItem, 
        setSelectedItem
    ] = useState( null );

    // Slug Query Param state.
    const [
        searchType, 
        setSearchType
    ] = useState( 'content' );  

    // Title Query Param state.
    const [
        titleOnly, 
        setTitleOnly
    ] = useState( true );   


    const isBoolean = val => 'boolean' === typeof val;


    /**
	 * Using the keyword and the list of tags that are linked to the parent block
	 * search for posts that match and return them to the autocomplete component.
	 *
	 * @param {string} keyword search query string
	 */
	const handleSearchStringChange = (keyword) => {
        // Remove existing search results.
        setSearchResults([]);

        if ( keyword ) {
            setSearchString(keyword);
        } else {
            console.log( searchString );
        }
        
        // Show the results after typing at least 3 characters
		if ( searchString && searchString.length >= minCharacters ) {
			
            setIsLoading(true);
            
            
            let requests = [];

            
            if ( customEndpoint ) {
                let restPath = '/acketon-components/v1/search';

                if ( ! isBoolean( customEndpoint ) ) {
                    restPath = customEndpoint;
                }
                console.log(postTypes);

                let path = addQueryArgs( restPath, {
                    post_type: postTypes,
                } );

                path = addQueryArgs( path, {
                    search: searchString,
                } );

                // Add the title_only argument if needed.
                if ( titleOnly ) {
                    path = addQueryArgs( path, {
                        title_only: true,
                    } );
                }

                // Add custom query args.
                if ( typeof customQueryArgs === 'object' && customQueryArgs !== null ) {
                    path = addQueryArgs( path, customQueryArgs );
                }

                console.log( path );

                // Make the request to the standard endpoint.
                const request = apiFetch( {
                    path: path,
                } );

                // Add this request to the requests array.
                requests.push( request );
                console.log( requests );

            } else {
                postTypes.forEach( postType => {
                    // Build a request for each post type.
                    // Use the standard but simpler endpoint.
                    let path = addQueryArgs( `/wp/v2/${postType}`, {
                        //search: searchString,
                    } );

                    // Add the Slug argument if needed.
                    if ( 'slug' === searchType ) {
                        path = addQueryArgs( path, {
                            slug: searchString,
                        } );
                    } else if ( 'postid' === searchType ) {
                        path = addQueryArgs( path, {
                            include: searchString,
                        } );
                    } else {
                        path = addQueryArgs( path, {
                            search: searchString,
                        } );
                    }

                    console.log( path );

                    // Make the request to the standard endpoint.
                    const request = apiFetch( {
                        path: path,
                    } );

                    // Add this request to the requests array.
                    requests.push( request );
                } );
            }

            

            Promise.all( requests ).then( ( results ) => {
                console.log( results );
                let data = results.reduce( ( result, final ) => [...final, ...result], [] );
                setSearchResults( data );
                setIsLoading( false );
            } );
		}

		
    };

    const handleItemSelection = function( post, featuredImage ) {
        if ( post === 0) {
            setSelectedItem( null );
        }
        setSelectedItem( post );

        console.log(post);
        

        

        

        setAttributes( {
			postChooserPostID: post.id,
			postChooserPostType: post.type,
			postChooserPostTitle: post.title.rendered,
            postChooserPostExcerpt: post.excerpt.rendered,
            postChooserPostThumbnail: featuredImage
		} );

        // Call passed onSelectPost Function.
        if ( onSelectPost instanceof Function ) {
            onSelectPost( post );
        }
    }

    const SearchItem = function( props ) {
        const { 
            postID,
            title,
            post
        } = props;

        const { featuredImage, fetchedFeaturedImage = false } = useSelect( ( select ) => {
            const { getMedia } = select( 'core' );
            const featuredImageId = post.featured_media;

            return {
                fetchedFeaturedImage: true,
                featuredImage: ( featuredImageId ) ? select( 'core' ).getMedia( featuredImageId ) : null,
            };
        } );

        // const { featuredImage } = useSelect( ( select ) => {
        //     const { getMedia } = select( 'core' );
        //     const featuredImageId = post.featured_media;
        //     const featuredImageObject = ( featuredImageId ) ? select( 'core' ).getMedia( featuredImageId ) : null,

        //     return {
        //         featuredImage: featuredImageObject,
        //     };
        // } );

        console.log( "The featured image: ", featuredImage );
       
        return (
            <div className={ 'acketon-components-post-chooser-results-item-container' }>
                <div className={ 'acketon-components-post-chooser-results-item-inner' }>
                    <div className={ 'acketon-components-post-chooser-results-item-postdetails' }>
                        <div className={ 'acketon-components-post-chooser-results-item-title' }>
                            { title.rendered }
                        </div>
                        <div>
                            <span className={ 'acketon-components-post-chooser-results-item-modified' }>Last Updated: { post.modified }</span>
                            <span className={ 'acketon-components-post-chooser-results-item-status' }>Status: { post.status }</span>
                        </div>
                    </div>
                    <div className={ 'acketon-components-post-chooser-results-item-posttype' }>
                        <span className={ 'acketon-components-post-chooser-results-item-type' }>{ post.type }</span>
                    </div>
                </div>
                { fetchedFeaturedImage &&
                    <Button
                        className="acketon-components-post-chooser-item-select-button"
                        isSecondary
                        onClick={() => handleItemSelection(post, featuredImage)}
                    >Select</Button>
                }
            </div>
        );
    }

    return (
        <Fragment>
            <Button
                className="acketon-components-post-chooser-button"
                isDefault
                onClick={ () => {
                    //this.updateSuggestions( null, postTypes, taxonomies, meta, imageSize );
                    //setState( { isModalOpen: true } )
                    setIsModalOpen(true);
                } }
            >{ buttonLabel }</Button>

            { isModalOpen && (
                <Modal
                    title={ __( 'Post Chooser' ) }
                    onRequestClose={ () => setIsModalOpen(false) }
                    className="acketon-components-post-chooser-modal"
                >
                    { ! customEndpoint &&
                        <RadioControl
                            label="Search by"
                            help="The type of search to perform"
                            selected={ searchType }
                            options={ [
                                { label: 'Content', value: 'content' },
                                { label: 'Post ID', value: 'postid' },
                                { label: 'Post Slug', value: 'slug' },
                            ] }
                            onChange={ ( option ) => setSearchType( option ) }
                        />
                    }
                    <div className='acketon-components-post-chooser-search-bar'>
                        <TextControl
                            className='acketon-components-post-chooser-search-field'
                            label={ label }
                            value={ searchString }
                            onChange={ handleSearchStringChange }
                            placeholder={ placeholder }
                            type={ 'postid' === searchType ? 'number' : 'text' }
                        />

                        <Button 
                            className="acketon-components-post-chooser-search-button"
                            isPrimary
                            onClick={ () => {
                                handleSearchStringChange()
                            } }
                        >{ __( 'Search', 'acketon-components' ) }</Button>
                    </div>
                    
                    
                    { searchString.length ? (
                        <ul className={ 'acketon-components-post-chooser-results' } >
                            { searchString.length < minCharacters && !isLoading && !searchResults.length && (
                                <li className={ 'acketon-components-post-chooser-results-item' }>
                                    <Button disabled>{ __( `Enter a minimum of ${minCharacters} characters to search.` ) }</Button>
                                </li>
                            ) }
                            { isLoading && 
                                <Spinner /> 
                            }
                            { searchString.length >= minCharacters && !isLoading && !searchResults.length && (
                                <li className={ 'acketon-components-post-chooser-results-item' }>
                                    <Button disabled>{ __( 'No Items found' ) }</Button>
                                </li>
                            ) }
                            {searchResults.map((post, index) => {
                                if (!post.title.rendered.length) {
                                    return null;
                                }
                                
                                return (
                                    <li key={post.id} className={ 'acketon-components-post-chooser-results-item' }>
                                        <SearchItem
                                            postID={ post.id }
                                            title={ post.title }
                                            post={ post }
                                            
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    ) : null }
                </Modal>
            ) }
        </Fragment>
    )
};

// Export dependencies for easy importing in blocks.
export {
	PostChooserAttributes,
	//PostChooserControls,
};

//export default withInstanceId( PostChooser );
//export { PostChooser };