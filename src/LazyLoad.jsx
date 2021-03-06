import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { add, remove } from 'eventlistener';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import parentScroll from './utils/parentScroll';
import inViewport from './utils/inViewport';

export default class LazyLoad extends Component {
  constructor(props) {
    super(props);

    this.lazyLoadHandler = this.lazyLoadHandler.bind(this);

    if (props.throttle > 0) {
      if (props.debounce) {
        this.lazyLoadHandler = debounce(this.lazyLoadHandler, props.throttle);
      } else {
        this.lazyLoadHandler = throttle(this.lazyLoadHandler, props.throttle);
      }
    }

    this.state = { visible: false, loaded: false };
  }

  componentDidMount() {
    const eventNode = this.getEventNode();

    this.lazyLoadHandler();

    if (this.lazyLoadHandler.flush) {
      this.lazyLoadHandler.flush();
    }

    add(window, 'resize', this.lazyLoadHandler);
    add(eventNode, 'scroll', this.lazyLoadHandler);
  }

  componentWillReceiveProps() {
    if (!this.state.visible) {
      this.lazyLoadHandler();
    }
  }

  shouldComponentUpdate(_nextProps, nextState) {
    return nextState.visible;
  }

  componentWillUnmount() {
    if (this.lazyLoadHandler.cancel) {
      this.lazyLoadHandler.cancel();
    }

    this.detachListeners();
  }

  getEventNode() {
    return parentScroll(findDOMNode(this));
  }

  getOffset() {
    const {
      offset, offsetVertical, offsetHorizontal,
      offsetTop, offsetBottom, offsetLeft, offsetRight, threshold,
    } = this.props;

    const _offsetAll = threshold || offset;
    const _offsetVertical = offsetVertical || _offsetAll;
    const _offsetHorizontal = offsetHorizontal || _offsetAll;

    return {
      top: offsetTop || _offsetVertical,
      bottom: offsetBottom || _offsetVertical,
      left: offsetLeft || _offsetHorizontal,
      right: offsetRight || _offsetHorizontal,
    };
  }

  lazyLoadHandler() {
    const offset = this.getOffset();
    const node = findDOMNode(this);
    const eventNode = this.getEventNode();

    if (inViewport(node, eventNode, offset)) {
      const { onContentVisible } = this.props;

      this.setState({ visible: true }, () => {
        if (onContentVisible) {
          onContentVisible();
        }
      });
      this.detachListeners();
    }
  }

  detachListeners() {
    const eventNode = this.getEventNode();

    remove(window, 'resize', this.lazyLoadHandler);
    remove(eventNode, 'scroll', this.lazyLoadHandler);
  }

  preLoadImage() {
    const { imageProps, originalSrc } = this.props;
    const { visible, loaded } = this.state;
    const self = this;

    if(originalSrc && visible && !loaded) {
      this.newImg = new Image();
      
      this.newImg.onload = function(evt) {
        self.setState({ loaded: true });
      }
      // handle failure
      this.newImg.onerror = function(){
        console.log(originalSrc, "couldn't be loaded");
      };
      
      this.newImg.src = originalSrc;
    }
    
    if(visible && !loaded) {
      return <img {...imageProps} />
    } else if(visible && loaded) {
      return <img {...imageProps} src={originalSrc} />
    } else if(!visible && !loaded) {
      return <img {...imageProps} />
    }

  }

  render() {
    const { className, height, width, imageProps, loaderImage } = this.props;
    const { visible } = this.state;

    const elStyles = { height, width };
    const elClasses = (
      'LazyLoad' +
      (visible ? ' is-visible' : '') +
      (className ? ` ${className}` : '')
    );

    // Make sure to load the image preload in case loaderImage is set to true 
    var img = null;
    if(loaderImage === true) {
      img = this.preLoadImage();
    } else {
      if(visible) {
        img = <img {...imageProps} />;
      }
    }

    return (
      <div className={elClasses} style={elStyles}>
        {img}
      </div>
    );
  }
}

LazyLoad.propTypes = {
  className: PropTypes.string,
  debounce: PropTypes.bool,
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  offset: PropTypes.number,
  offsetBottom: PropTypes.number,
  offsetHorizontal: PropTypes.number,
  offsetLeft: PropTypes.number,
  offsetRight: PropTypes.number,
  offsetTop: PropTypes.number,
  offsetVertical: PropTypes.number,
  threshold: PropTypes.number,
  throttle: PropTypes.number,
  width: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onContentVisible: PropTypes.func,
  originalSrc: PropTypes.string,
  loaderImage: PropTypes.bool,
  imageProps: PropTypes.object.isRequired
};

LazyLoad.defaultProps = {
  debounce: true,
  offset: 0,
  offsetBottom: 0,
  offsetHorizontal: 0,
  offsetLeft: 0,
  offsetRight: 0,
  offsetTop: 0,
  offsetVertical: 0,
  throttle: 250,
  loaderImage: false
};
